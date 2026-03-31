/* Horizon CRM - Desk JavaScript
 * Horizon CRM — Travel Agency CRM
 */

frappe.provide("horizon_crm");

horizon_crm.STATUS_COLORS = {
    // Travel Lead
    "New": "blue",
    "Contacted": "orange",
    "Interested": "yellow",
    "Qualified": "cyan",
    "Converted": "green",
    "Do Not Contact": "red",
    // Travel Inquiry
    "Quoted": "orange",
    "Won": "green",
    "Lost": "red",
    // Travel Booking
    "Confirmed": "green",
    "In Progress": "orange",
    "Completed": "blue",
    "Cancelled": "red",
    // Travel Agency
    "Active": "green",
    "Inactive": "red",
    "Suspended": "orange",
    // Itinerary
    "Draft": "blue",
    "Shared": "orange",
    "Approved": "green",
    "Archived": "grey",
    // Invoice
    "Sent": "orange",
    "Paid": "green",
    "Partially Paid": "yellow",
    "Overdue": "red",
    // Payment
    "Pending": "orange",
    "Received": "green",
    "Refunded": "red",
};

// ─── Travel Inquiry ────────────────────────────────────────────────────
frappe.ui.form.on("Travel Inquiry", {
    refresh(frm) {
        // Status indicator
        let color = horizon_crm.STATUS_COLORS[frm.doc.status] || "grey";
        frm.page.set_indicator(frm.doc.status, color);

        // Create Booking action on Won inquiries
        if (frm.doc.status === "Won" && !frm.is_new()) {
            frm.add_custom_button(__("Create Booking"), function() {
                frappe.model.open_mapped_doc({
                    method: "horizon_crm.api.inquiry.create_booking_from_inquiry",
                    frm: frm,
                });
            }, __("Actions"));
        }

        // Quick action buttons (Frappe CRM inspired)
        if (!frm.is_new()) {
            // Assign To
            if (!frm.doc.assigned_to) {
                frm.add_custom_button(__("Assign"), function() {
                    frm.assign_to.show();
                }, __("Actions"));
            }
            // Schedule Follow-up
            frm.add_custom_button(__("Set Follow-up"), function() {
                frappe.prompt({
                    fieldname: "follow_up_date",
                    fieldtype: "Date",
                    label: __("Follow-up Date"),
                    reqd: 1,
                    default: frappe.datetime.add_days(frappe.datetime.nowdate(), 3),
                }, (values) => {
                    frm.set_value("follow_up_date", values.follow_up_date).then(() => frm.save());
                }, __("Schedule Follow-up"), __("Set"));
            }, __("Actions"));
        }

        // Dashboard: show related bookings count
        if (!frm.is_new()) {
            frappe.xcall("frappe.client.get_count", {
                doctype: "Travel Booking",
                filters: { inquiry: frm.doc.name }
            }).then(count => {
                if (count > 0) {
                    frm.dashboard.add_indicator(
                        __("{0} Booking(s)", [count]),
                        "green"
                    );
                }
            });
        }

        // Pipeline progress visualization
        if (!frm.is_new()) {
            horizon_crm.render_inquiry_pipeline(frm);
        }

        // Follow-up alert
        if (frm.doc.follow_up_date) {
            const today = frappe.datetime.nowdate();
            const diff = frappe.datetime.get_diff(frm.doc.follow_up_date, today);
            if (diff < 0) {
                frm.dashboard.add_indicator(
                    __("Follow-up overdue by {0} day(s)", [Math.abs(diff)]),
                    "red"
                );
            } else if (diff === 0) {
                frm.dashboard.add_indicator(__("Follow-up due today"), "orange");
            } else if (diff <= 3) {
                frm.dashboard.add_indicator(
                    __("Follow-up in {0} day(s)", [diff]),
                    "blue"
                );
            }
        }

        // Customer activity sidebar (Frappe CRM inspired)
        if (!frm.is_new() && frm.doc.customer) {
            horizon_crm.render_customer_sidebar(frm, frm.doc.customer);
        }

        // WhatsApp button for inquiry contact
        if (!frm.is_new() && frm.doc.customer_phone) {
            horizon_crm.add_whatsapp_button(frm, "customer_phone");
        }
    },

    customer(frm) {
        // Auto-fill customer details when customer is selected
        if (frm.doc.customer) {
            frappe.db.get_value("Travel Customer", frm.doc.customer, [
                "customer_name", "email", "phone"
            ]).then(r => {
                if (r.message) {
                    if (r.message.customer_name) frm.set_value("customer_name", r.message.customer_name);
                    if (r.message.email) frm.set_value("customer_email", r.message.email);
                    if (r.message.phone) frm.set_value("customer_phone", r.message.phone);
                }
            });
        }
    },

    status(frm) {
        frm.refresh_fields();
    }
});

// ─── Inquiry Pipeline Visualizer ───────────────────────────────────────
horizon_crm.render_inquiry_pipeline = function(frm) {
    const stages = ["New", "Contacted", "Quoted", "Won"];
    const currentIdx = stages.indexOf(frm.doc.status);
    const isLost = frm.doc.status === "Lost";

    let html = '<div class="horizon-pipeline">';
    stages.forEach((stage, idx) => {
        let cls = "pipeline-stage";
        if (isLost) {
            cls += idx === 0 ? " lost" : "";
        } else if (idx < currentIdx) {
            cls += " completed";
        } else if (idx === currentIdx) {
            cls += " active";
        }
        html += `<div class="${cls}">
            <div class="pipeline-dot"></div>
            <div class="pipeline-label">${stage}</div>
        </div>`;
        if (idx < stages.length - 1) {
            const lineClass = (!isLost && idx < currentIdx) ? "pipeline-line completed" : "pipeline-line";
            html += `<div class="${lineClass}"></div>`;
        }
    });
    if (isLost) {
        html += `<div class="pipeline-line"></div>`;
        html += `<div class="pipeline-stage lost active">
            <div class="pipeline-dot"></div>
            <div class="pipeline-label">Lost</div>
        </div>`;
    }
    html += '</div>';
    frm.dashboard.add_section(html);
};

// ─── Customer Activity Sidebar ─────────────────────────────────────────
horizon_crm.render_customer_sidebar = function(frm, customer) {
    Promise.all([
        frappe.xcall("frappe.client.get_count", {
            doctype: "Travel Inquiry",
            filters: { customer: customer }
        }),
        frappe.xcall("frappe.client.get_count", {
            doctype: "Travel Booking",
            filters: { customer: customer }
        }),
        frappe.xcall("frappe.client.get_count", {
            doctype: "Travel Feedback",
            filters: { customer: customer }
        })
    ]).then(([inquiries, bookings, feedback]) => {
        const sidebar_html = `
            <div class="horizon-customer-sidebar">
                <h6 class="sidebar-title">${__("Customer Activity")}</h6>
                <div class="sidebar-stats">
                    <div class="sidebar-stat">
                        <span class="sidebar-stat-value">${inquiries}</span>
                        <span class="sidebar-stat-label">${__("Inquiries")}</span>
                    </div>
                    <div class="sidebar-stat">
                        <span class="sidebar-stat-value">${bookings}</span>
                        <span class="sidebar-stat-label">${__("Bookings")}</span>
                    </div>
                    <div class="sidebar-stat">
                        <span class="sidebar-stat-value">${feedback}</span>
                        <span class="sidebar-stat-label">${__("Feedback")}</span>
                    </div>
                </div>
            </div>
        `;
        frm.dashboard.add_section(sidebar_html);
    });
};

// ─── Travel Booking ────────────────────────────────────────────────────
frappe.ui.form.on("Travel Booking", {
    refresh(frm) {
        let color = horizon_crm.STATUS_COLORS[frm.doc.status] || "grey";
        frm.page.set_indicator(frm.doc.status, color);

        // Payment progress bar (Frappe CRM inspired)
        if (!frm.is_new() && frm.doc.total_amount > 0) {
            horizon_crm.render_payment_progress(frm);
        }

        // Show balance indicator
        if (frm.doc.balance_amount > 0) {
            frm.dashboard.add_indicator(
                __("Balance: {0}", [format_currency(frm.doc.balance_amount, frm.doc.currency)]),
                "orange"
            );
        } else if (frm.doc.total_amount > 0 && frm.doc.balance_amount <= 0) {
            frm.dashboard.add_indicator(__("Fully Paid"), "green");
        }

        // Booking status timeline
        if (!frm.is_new()) {
            const steps = ["Confirmed", "In Progress", "Completed"];
            const currentIdx = steps.indexOf(frm.doc.status);
            if (currentIdx >= 0 || frm.doc.status === "Cancelled") {
                let html = '<div class="booking-timeline">';
                steps.forEach((step, idx) => {
                    const active = idx <= currentIdx ? "active" : "";
                    html += `<div class="step ${active}"><span class="step-label">${step}</span></div>`;
                });
                html += '</div>';
                frm.dashboard.add_section(html);
            }
        }

        // Quick links to related records
        if (!frm.is_new()) {
            if (frm.doc.inquiry) {
                frm.add_custom_button(__("View Inquiry"), function() {
                    frappe.set_route("Form", "Travel Inquiry", frm.doc.inquiry);
                }, __("Go To"));
            }
            if (frm.doc.itinerary) {
                frm.add_custom_button(__("View Itinerary"), function() {
                    frappe.set_route("Form", "Travel Itinerary", frm.doc.itinerary);
                }, __("Go To"));
            }
            if (frm.doc.customer) {
                frm.add_custom_button(__("View Customer"), function() {
                    frappe.set_route("Form", "Travel Customer", frm.doc.customer);
                }, __("Go To"));
            }

            // Create Invoice action
            frm.add_custom_button(__("Create Invoice"), function() {
                frappe.new_doc("Travel Invoice", {
                    booking: frm.doc.name,
                    customer: frm.doc.customer,
                });
            }, __("Actions"));
        }
    }
});

// ─── Payment Progress Bar ──────────────────────────────────────────────
horizon_crm.render_payment_progress = function(frm) {
    const total = frm.doc.total_amount || 0;
    const paid = frm.doc.paid_amount || 0;
    const percentage = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;

    let barColor = "var(--horizon-success)";
    if (percentage < 30) barColor = "var(--horizon-danger)";
    else if (percentage < 70) barColor = "var(--horizon-secondary)";

    const html = `
        <div class="horizon-payment-progress">
            <div class="payment-progress-header">
                <span class="progress-label">${__("Payment Progress")}</span>
                <span class="progress-amount">${format_currency(paid)} / ${format_currency(total)}</span>
            </div>
            <div class="payment-progress-bar">
                <div class="payment-progress-fill" style="width: ${percentage}%; background: ${barColor};"></div>
            </div>
            <div class="payment-progress-footer">
                <span>${percentage}% ${__("collected")}</span>
            </div>
        </div>
    `;
    frm.dashboard.add_section(html);
};

// ─── Travel Itinerary ──────────────────────────────────────────────────
frappe.ui.form.on("Travel Itinerary", {
    refresh(frm) {
        let color = horizon_crm.STATUS_COLORS[frm.doc.status] || "grey";
        frm.page.set_indicator(frm.doc.status, color);

        // Cost summary
        if (!frm.is_new() && frm.doc.total_cost > 0) {
            frm.dashboard.add_indicator(
                __("Total Cost: {0}", [format_currency(frm.doc.total_cost)]),
                "blue"
            );
        }
    },

    start_date(frm) {
        horizon_crm.calc_itinerary_days(frm);
    },

    end_date(frm) {
        horizon_crm.calc_itinerary_days(frm);
    }
});

horizon_crm.calc_itinerary_days = function(frm) {
    if (frm.doc.start_date && frm.doc.end_date) {
        const diff = frappe.datetime.get_diff(frm.doc.end_date, frm.doc.start_date);
        if (diff >= 0) {
            frm.set_value("num_days", diff + 1);
        }
    }
};

frappe.ui.form.on("Itinerary Day Item", {
    estimated_cost(frm) {
        let total = 0;
        (frm.doc.items || []).forEach(item => {
            total += item.estimated_cost || 0;
        });
        frm.set_value("total_cost", total);
    },
    items_remove(frm) {
        let total = 0;
        (frm.doc.items || []).forEach(item => {
            total += item.estimated_cost || 0;
        });
        frm.set_value("total_cost", total);
    }
});

// ─── Travel Customer ───────────────────────────────────────────────────
frappe.ui.form.on("Travel Customer", {
    refresh(frm) {
        // Show inquiry/booking/feedback counts on dashboard
        if (!frm.is_new()) {
            Promise.all([
                frappe.xcall("frappe.client.get_count", {
                    doctype: "Travel Inquiry",
                    filters: { customer: frm.doc.name }
                }),
                frappe.xcall("frappe.client.get_count", {
                    doctype: "Travel Booking",
                    filters: { customer: frm.doc.name }
                }),
                frappe.xcall("frappe.client.get_count", {
                    doctype: "Travel Feedback",
                    filters: { customer: frm.doc.name }
                })
            ]).then(([inq_count, book_count, fb_count]) => {
                if (inq_count > 0) {
                    frm.dashboard.add_indicator(__("{0} Inquiry(s)", [inq_count]), "blue");
                }
                if (book_count > 0) {
                    frm.dashboard.add_indicator(__("{0} Booking(s)", [book_count]), "green");
                }
                if (fb_count > 0) {
                    frm.dashboard.add_indicator(__("{0} Feedback(s)", [fb_count]), "orange");
                }
            });

            // Quick actions
            frm.add_custom_button(__("New Inquiry"), function() {
                frappe.new_doc("Travel Inquiry", { customer: frm.doc.name });
            }, __("Create"));

            frm.add_custom_button(__("New Invoice"), function() {
                frappe.new_doc("Travel Invoice", { customer: frm.doc.name });
            }, __("Create"));

            // WhatsApp button (prefer mobile_no, fallback to phone)
            horizon_crm.add_whatsapp_button(frm, frm.doc.mobile_no ? "mobile_no" : "phone");
        }
    }
});

// ─── Travel Agency Staff ───────────────────────────────────────────────
frappe.ui.form.on("Travel Agency Staff", {
    setup(frm) {
        frm.set_query("team", function() {
            return {
                filters: { agency: frm.doc.agency }
            };
        });
    }
});

// ─── Travel Feedback ───────────────────────────────────────────────────
frappe.ui.form.on("Travel Feedback", {
    refresh(frm) {
        // Star rating visual
        if (frm.doc.rating && !frm.is_new()) {
            const stars = "★".repeat(frm.doc.rating) + "☆".repeat(5 - frm.doc.rating);
            frm.dashboard.add_indicator(stars, frm.doc.rating >= 4 ? "green" : frm.doc.rating >= 3 ? "orange" : "red");
        }
    }
});

// ─── Sidebar Workspace Enhancement ─────────────────────────────────────
// Highlight the Horizon CRM workspace in sidebar for branding
$(document).ready(function() {
    // Add Horizon CRM branding class to body when on CRM pages
    if (frappe.boot && frappe.boot.app_name === "Horizon CRM") {
        $("body").addClass("horizon-crm-active");
    }
});

// ─── WhatsApp Click-to-Chat Helper ─────────────────────────────────────
horizon_crm.add_whatsapp_button = function(frm, phone_field) {
    const phone = frm.doc[phone_field];
    if (!phone) return;

    // Strip non-numeric characters except leading +
    const cleaned = phone.replace(/[^0-9+]/g, "").replace(/^\+/, "");
    if (!cleaned) return;

    frm.add_custom_button(
        __("WhatsApp"),
        function() {
            window.open("https://wa.me/" + cleaned, "_blank");
        },
        __("Communication")
    );
};

// ─── Travel Lead ───────────────────────────────────────────────────────
frappe.ui.form.on("Travel Lead", {
    refresh(frm) {
        let color = horizon_crm.STATUS_COLORS[frm.doc.status] || "grey";
        frm.page.set_indicator(frm.doc.status, color);

        if (!frm.is_new()) {
            // Lead pipeline visualization
            horizon_crm.render_lead_pipeline(frm);

            // WhatsApp button (prefer mobile_no, fallback to phone)
            horizon_crm.add_whatsapp_button(frm, frm.doc.mobile_no ? "mobile_no" : "phone");

            // Follow-up alert
            if (frm.doc.next_follow_up) {
                const today = frappe.datetime.nowdate();
                const diff = frappe.datetime.get_diff(frm.doc.next_follow_up, today);
                if (diff < 0) {
                    frm.dashboard.add_indicator(
                        __("Follow-up overdue by {0} day(s)", [Math.abs(diff)]),
                        "red"
                    );
                } else if (diff === 0) {
                    frm.dashboard.add_indicator(__("Follow-up due today"), "orange");
                } else if (diff <= 3) {
                    frm.dashboard.add_indicator(
                        __("Follow-up in {0} day(s)", [diff]),
                        "blue"
                    );
                }
            }

            // Convert to Inquiry action (for Qualified leads)
            if (frm.doc.status === "Qualified" || frm.doc.status === "Interested") {
                frm.add_custom_button(__("Create Inquiry"), function() {
                    frappe.new_doc("Travel Inquiry", {
                        lead: frm.doc.name,
                        customer_name: frm.doc.lead_name,
                        customer_email: frm.doc.email,
                        customer_phone: frm.doc.phone || frm.doc.mobile_no,
                        destination: frm.doc.interested_destination,
                        travel_type: frm.doc.travel_type,
                        source: frm.doc.source,
                    });
                }, __("Actions"));
            }

            // Convert to Customer action
            if (frm.doc.status === "Converted") {
                frm.add_custom_button(__("Create Customer"), function() {
                    frappe.new_doc("Travel Customer", {
                        lead: frm.doc.name,
                        customer_name: frm.doc.lead_name,
                        email: frm.doc.email,
                        phone: frm.doc.phone,
                        mobile_no: frm.doc.mobile_no,
                    });
                }, __("Actions"));
            }

            // Dashboard: show related inquiries/customers
            Promise.all([
                frappe.xcall("frappe.client.get_count", {
                    doctype: "Travel Inquiry",
                    filters: { lead: frm.doc.name }
                }),
                frappe.xcall("frappe.client.get_count", {
                    doctype: "Travel Customer",
                    filters: { lead: frm.doc.name }
                })
            ]).then(([inquiries, customers]) => {
                if (inquiries > 0) {
                    frm.dashboard.add_indicator(__("{0} Inquiry(s)", [inquiries]), "blue");
                }
                if (customers > 0) {
                    frm.dashboard.add_indicator(__("{0} Customer(s)", [customers]), "green");
                }
            });
        }
    }
});

// ─── Lead Pipeline Visualizer ──────────────────────────────────────────
horizon_crm.render_lead_pipeline = function(frm) {
    const stages = ["New", "Contacted", "Interested", "Qualified", "Converted"];
    const currentIdx = stages.indexOf(frm.doc.status);
    const isDNC = frm.doc.status === "Do Not Contact";

    let html = '<div class="horizon-pipeline">';
    stages.forEach((stage, idx) => {
        let cls = "pipeline-stage";
        if (isDNC) {
            cls += idx === 0 ? " lost" : "";
        } else if (idx < currentIdx) {
            cls += " completed";
        } else if (idx === currentIdx) {
            cls += " active";
        }
        html += `<div class="${cls}">
            <div class="pipeline-dot"></div>
            <div class="pipeline-label">${stage}</div>
        </div>`;
        if (idx < stages.length - 1) {
            const lineClass = (!isDNC && idx < currentIdx) ? "pipeline-line completed" : "pipeline-line";
            html += `<div class="${lineClass}"></div>`;
        }
    });
    if (isDNC) {
        html += `<div class="pipeline-line"></div>`;
        html += `<div class="pipeline-stage lost active">
            <div class="pipeline-dot"></div>
            <div class="pipeline-label">Do Not Contact</div>
        </div>`;
    }
    html += '</div>';
    frm.dashboard.add_section(html);
};

// ─── Travel Invoice ────────────────────────────────────────────────────
frappe.ui.form.on("Travel Invoice", {
    refresh(frm) {
        let color = horizon_crm.STATUS_COLORS[frm.doc.status] || "grey";
        frm.page.set_indicator(frm.doc.status, color);

        // Outstanding amount indicator
        if (!frm.is_new()) {
            if (frm.doc.outstanding_amount > 0) {
                frm.dashboard.add_indicator(
                    __("Outstanding: {0}", [format_currency(frm.doc.outstanding_amount)]),
                    "orange"
                );
            } else if (frm.doc.grand_total > 0 && frm.doc.outstanding_amount <= 0) {
                frm.dashboard.add_indicator(__("Fully Paid"), "green");
            }

            // Quick links
            if (frm.doc.booking) {
                frm.add_custom_button(__("View Booking"), function() {
                    frappe.set_route("Form", "Travel Booking", frm.doc.booking);
                }, __("Go To"));
            }
            if (frm.doc.customer) {
                frm.add_custom_button(__("View Customer"), function() {
                    frappe.set_route("Form", "Travel Customer", frm.doc.customer);
                }, __("Go To"));
            }
        }
    },

    tax_percent(frm) {
        frm.trigger("calculate_totals");
    },

    discount(frm) {
        frm.trigger("calculate_totals");
    },

    paid_amount(frm) {
        frm.trigger("calculate_totals");
    },

    calculate_totals(frm) {
        let subtotal = 0;
        (frm.doc.items || []).forEach(item => {
            item.amount = flt(item.quantity) * flt(item.rate);
            subtotal += item.amount;
        });
        frm.set_value("subtotal", subtotal);
        const tax_amount = subtotal * flt(frm.doc.tax_percent) / 100;
        frm.set_value("tax_amount", tax_amount);
        const grand_total = subtotal + tax_amount - flt(frm.doc.discount);
        frm.set_value("grand_total", grand_total);
        frm.set_value("outstanding_amount", grand_total - flt(frm.doc.paid_amount));
        frm.refresh_fields();
    }
});

frappe.ui.form.on("Invoice Item", {
    quantity(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, "amount", flt(row.quantity) * flt(row.rate));
        frm.trigger("calculate_totals");
    },
    rate(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, "amount", flt(row.quantity) * flt(row.rate));
        frm.trigger("calculate_totals");
    },
    items_remove(frm) {
        frm.trigger("calculate_totals");
    }
});

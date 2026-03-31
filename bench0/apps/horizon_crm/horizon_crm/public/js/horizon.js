/* Horizon CRM - Desk JavaScript */

// Add status indicators for Horizon CRM doctypes
frappe.provide("horizon_crm");

horizon_crm.STATUS_COLORS = {
    // Travel Inquiry
    "New": "blue",
    "Contacted": "orange",
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

        // Dashboard stats: show related bookings count
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
        // Refresh form when status changes to show/hide lost reason fields
        frm.refresh_fields();
    }
});

// ─── Travel Booking ────────────────────────────────────────────────────
frappe.ui.form.on("Travel Booking", {
    refresh(frm) {
        let color = horizon_crm.STATUS_COLORS[frm.doc.status] || "grey";
        frm.page.set_indicator(frm.doc.status, color);

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
    }
});

// ─── Travel Itinerary ──────────────────────────────────────────────────
frappe.ui.form.on("Travel Itinerary", {
    refresh(frm) {
        let color = horizon_crm.STATUS_COLORS[frm.doc.status] || "grey";
        frm.page.set_indicator(frm.doc.status, color);
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
        const start = frappe.datetime.str_to_obj(frm.doc.start_date);
        const end = frappe.datetime.str_to_obj(frm.doc.end_date);
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
        // Show inquiry/booking counts on dashboard
        if (!frm.is_new()) {
            Promise.all([
                frappe.xcall("frappe.client.get_count", {
                    doctype: "Travel Inquiry",
                    filters: { customer: frm.doc.name }
                }),
                frappe.xcall("frappe.client.get_count", {
                    doctype: "Travel Booking",
                    filters: { customer: frm.doc.name }
                })
            ]).then(([inq_count, book_count]) => {
                if (inq_count > 0) {
                    frm.dashboard.add_indicator(__("{0} Inquiry(s)", [inq_count]), "blue");
                }
                if (book_count > 0) {
                    frm.dashboard.add_indicator(__("{0} Booking(s)", [book_count]), "green");
                }
            });
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

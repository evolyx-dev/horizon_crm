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

// Convert Inquiry to Booking button
frappe.ui.form.on("Travel Inquiry", {
    refresh(frm) {
        if (frm.doc.status === "Won" && !frm.is_new()) {
            frm.add_custom_button(__("Create Booking"), function() {
                frappe.model.open_mapped_doc({
                    method: "horizon_crm.api.inquiry.create_booking_from_inquiry",
                    frm: frm,
                });
            }, __("Actions"));
        }
        
        // Set indicator
        let color = horizon_crm.STATUS_COLORS[frm.doc.status] || "grey";
        frm.page.set_indicator(frm.doc.status, color);
    }
});

// Booking - show balance and status
frappe.ui.form.on("Travel Booking", {
    refresh(frm) {
        let color = horizon_crm.STATUS_COLORS[frm.doc.status] || "grey";
        frm.page.set_indicator(frm.doc.status, color);
        
        if (frm.doc.balance_amount > 0) {
            frm.dashboard.add_indicator(
                __("Balance: {0}", [format_currency(frm.doc.balance_amount, frm.doc.currency)]),
                "orange"
            );
        }
    }
});

// Itinerary - auto-calculate total
frappe.ui.form.on("Travel Itinerary", {
    refresh(frm) {
        let color = horizon_crm.STATUS_COLORS[frm.doc.status] || "grey";
        frm.page.set_indicator(frm.doc.status, color);
    }
});

frappe.ui.form.on("Itinerary Day Item", {
    estimated_cost(frm) {
        let total = 0;
        (frm.doc.items || []).forEach(item => {
            total += item.estimated_cost || 0;
        });
        frm.set_value("total_cost", total);
    }
});

// Agency Staff - filter by agency
frappe.ui.form.on("Travel Agency Staff", {
    setup(frm) {
        frm.set_query("team", function() {
            return {
                filters: { agency: frm.doc.agency }
            };
        });
    }
});

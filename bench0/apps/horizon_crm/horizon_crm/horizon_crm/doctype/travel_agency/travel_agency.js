frappe.ui.form.on("Travel Agency", {
    refresh(frm) {
        if (!frm.is_new()) {
            frm.add_custom_button(__("View Staff"), function() {
                frappe.set_route("List", "Travel Agency Staff");
            });
            frm.add_custom_button(__("View Teams"), function() {
                frappe.set_route("List", "Travel Team");
            });
            frm.add_custom_button(__("View Inquiries"), function() {
                frappe.set_route("List", "Travel Inquiry");
            });
            frm.add_custom_button(__("View Bookings"), function() {
                frappe.set_route("List", "Travel Booking");
            });
        }
    }
});

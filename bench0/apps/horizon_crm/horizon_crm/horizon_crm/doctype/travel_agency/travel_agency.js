frappe.ui.form.on("Travel Agency", {
    refresh(frm) {
        if (frm.doc.name && !frm.is_new()) {
            frm.add_custom_button(__("View Staff"), function() {
                frappe.set_route("List", "Travel Agency Staff", {agency: frm.doc.name});
            });
            frm.add_custom_button(__("View Inquiries"), function() {
                frappe.set_route("List", "Travel Inquiry", {agency: frm.doc.name});
            });
            frm.add_custom_button(__("View Bookings"), function() {
                frappe.set_route("List", "Travel Booking", {agency: frm.doc.name});
            });
        }
    }
});

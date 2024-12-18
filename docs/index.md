---
layout: default
---

A Chrome extension that automates the process of filling author details in the Microsoft Conference Management Toolkit (CMT). This tool allows users to save, load, and auto-fill up to 4 authors' information (Email, First Name, Last Name, Organization, and Country) into the CMT form.

---

## **Features**

- **Save Author Details**: Save up to 4 authors' information for reuse.
- **Load Author Details**: Load saved author information into the extension.
- **Auto-Fill Form**: Automatically fill the author details sequentially in the CMT form with a single click.
- **Modern UI**: A user-friendly and responsive popup interface.

---

## **Installation**

1. **Clone or Download** the repository to your local machine:
   ```bash
   git clone https://github.com/arya2004/cmt-autofill.git
   ```

2. **Open Chrome** and navigate to:
   ```
   chrome://extensions
   ```

3. **Enable Developer Mode**:
   - Toggle the developer mode switch at the top-right corner.

4. **Load the Extension**:
   - Click on the "Load unpacked" button.
   - Select the folder where the extension files are located.

5. The extension will now be visible in your Chrome toolbar.

---

## **Usage**

### **Step 1: Save Author Details**
- Click the extension icon to open the popup.
- Fill in the author details (Email, First Name, Last Name, Organization, and Country) for up to 4 authors.
- Click the **Save Authors** button to store the information.

### **Step 2: Load Saved Details**
- If you've saved author details before, click the **Load Authors** button to populate the fields with saved data.

### **Step 3: Auto-Fill Form**
- Navigate to the CMT submission page.
- Click the **Auto-Fill Authors** button in the extension popup.
- The extension will sequentially:
  - Click the "Add Author" button.
  - Fill the details for each author.
  - Submit the form for each author.

---

## **Supported Fields**

Each author includes the following details:
- **Email**
- **First Name**
- **Last Name**
- **Organization**
- **Country**


## **License**

This project is licensed under the [MIT License](LICENSE).

---

## **Support**

If you encounter any issues or have feature requests, feel free to open an issue on the repository or contact the maintainer.

Happy automating! 🚀

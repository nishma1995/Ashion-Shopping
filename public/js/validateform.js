function validateForm() {
    let firstName = document.getElementById('firstname').value;
    let lastName = document.getElementById('lastname').value;
    let email = document.getElementById('email').value;
    let phone = document.getElementById('number').value;
    let password = document.getElementById('password').value;
    let confirmpassword = document.getElementById('confirmpassword').value;
    // ... other form fields ...
 
    // Reset error messages
    document.getElementById('firstnameError').innerHTML = '';
    document.getElementById('lastnameError').innerHTML = '';
    document.getElementById('numberError').innerHTML = '';
    document.getElementById('emailError').innerHTML = '';
    document.getElementById('passwordError').innerHTML = '';
    document.getElementById('confirmpasswordError').innerHTML = '';
    // ... reset other error messages ...
 
    // Validation logic for each form field
    if (firstName.trim() === '') {
       document.getElementById('firstnameError').innerHTML = 'Please insert first name';
       return false;
    }
    if (lastName.trim() === '') {
        document.getElementById('lastnameError').innerHTML = 'Please insert last name';
        return false;
     }
    if (email.trim() === '') {
        document.getElementById('emailError').innerHTML = 'Please insert an email';
        return false;
     } else {
        let emailPattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
        if (!email.match(emailPattern)) {
           document.getElementById('emailError').innerHTML = 'Please insert a valid email';
           return false;
        }
     }
  
     if (phone.trim() === '') {
        document.getElementById('numberError').innerHTML = 'Please insert phone number';
        return false;
     } else {
        let phonePattern = /^\d{10}$/;
        if (!phone.match(phonePattern)) {
           document.getElementById('numberError').innerHTML = 'Please insert a valid phone number';
           return false;
        }
     }
  
     if (password.trim() === '') {
        document.getElementById('passwordError').innerHTML = 'Please insert a password';
        return false;
     } else if (password.length < 6) {
        document.getElementById('passwordError').innerHTML = 'Password must be at least 6 characters long';
        return false;
     }
  
     if (confirmpassword .trim() === '') {
        document.getElementById('confirmpasswordError').innerHTML = 'Please confirm your password';
        return false;
     } else if (password !== confirmpassword) {
        document.getElementById('confirmpasswordError').innerHTML = 'Passwords do not match';
        return false;
     }
  
 
    return true;
 }
 function validateLoginForm() {
    // Get form field values
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
 
    // Reset error messages
    document.getElementById('emailError').innerHTML = '';
    document.getElementById('passwordError').innerHTML = '';
 
    // Validation logic for email
    if (email.trim() === '') {
       document.getElementById('emailError').innerHTML = 'Please insert an email';
       return false;
    } else {
       let emailPattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
       if (!email.match(emailPattern)) {
          document.getElementById('emailError').innerHTML = 'Please insert a valid email';
          return false;
       }
    }
 
    // Validation logic for password
    if (password.trim() === '') {
       document.getElementById('passwordError').innerHTML = 'Please insert a password';
       return false;
    }
 
    // All validations passed
    return true;
 }

 function validateEditCategoryForm() {
   var categoryImage = document.getElementById("categoryImage").value;
   var categoryName = document.getElementById("categoryName").value;
   var categoryDescription = document.getElementById("categoryDescription").value;

   // Reset error messages
   document.getElementById("imageError").innerHTML = "";
   document.getElementById("nameError").innerHTML = "";
   document.getElementById("descriptionError").innerHTML = "";

   var isValid = true;

   // Check if any of the fields are empty
   if (categoryImage === "") {
       document.getElementById("imageError").innerHTML = "Image is required";
       isValid = false;
   }

   if (categoryName === "") {
       document.getElementById("nameError").innerHTML = "Category Name is required";
       isValid = false;
   }

   if (categoryDescription === "") {
       document.getElementById("descriptionError").innerHTML = "Category Description is required";
       isValid = false;
   }

   return isValid;
}
 
<?php 
if(isset($_POST['submit'])){
    $to = "steve.codd@emirates.com"; // this is your Email address
    $from = $_POST['email']; // this is the sender's Email address
    $full_name = $_POST['full_name'];
    $subject = "Form submission";
    $subject2 = "Copy of your form submission";
    $message = $full_name . " wrote the following:" . "\n\n" . $_POST['message'];
    

    $headers = "From:" . $from . "\r\n" .
    'Reply-To: info@redwood-formations.com' . "\r\n" .
    'X-Mailer: PHP/' . phpversion();
    if ( mail($to,$subject,$message,$headers) ) {
        echo "The email has been sent!";
        } 
        else {
        echo "The email has failed!";
        }
   
    echo "Mail Sent. Thank you " . $full_name . ", we will contact you shortly.";
    // You can also use header('Location: thank_you.php'); to redirect to another page.
    // You cannot use header and echo together. It's one or the other.
    }
?>
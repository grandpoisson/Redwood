var emailCheck = /[^\x00-\x20()<>@,;:\\".[\]\x7f-\xff]+(?:\.[^\x00-\x20()<>@,;:\\".[\]\x7f-\xff]+)*\@[^\x00-\x20()<>@,;:\\".[\]\x7f-\xff]+(?:\.[^\x00-\x20()<>@,;:\\".[\]\x7f-\xff]+)+/i;
var phoneCheck = /^([0-9().\/\\\-\s]){1,}$/;

// Full name Field
$('form').on('input', '[name="enquiry[full_name]"]', function() {
	if ($(this).val().trim().length > 0 && $(this).val().trim().length < 100) $(this).attr('valid', '1');
	else $(this).attr('valid', '0');
	if ($('form').find('[valid=0]').length > 0) $(':submit').prop('disabled', true)
	else $(':submit').prop('disabled', false);
});
$('form').on('change', '[name="enquiry[full_name]"]', function() {
	if ($(this).attr('valid') === '0' && $(this).val().trim().length !== 0) 
		$(this).siblings('i.error').css('visibility', 'visible');
	else $(this).siblings('i.error').css('visibility', 'hidden');
});


// Email Field
$('form').on('input', '[name="enquiry[email]"]', function() {	
	if (emailCheck.test($('input[name="enquiry[email]"]').val().trim())) {
		$(this).attr('valid', '1');
		$('#phone').attr('valid', '1');
	} else {
		if (phoneCheck.test($('input#phone_code').val().trim()) && phoneCheck.test($('input#phone_number').val().trim())) {
			$('#phone').attr('valid', '1');
			$(this).attr('valid', '1');
		} else {
			$('#phone').attr('valid', '0');
			$(this).attr('valid', '0');
		}
	}
	
	if ($('form').find('[valid=0]').length > 0) $(':submit').prop('disabled', true)
	else $(':submit').prop('disabled', false);
});

$('form').on('change', '[name="enquiry[email]"]', function() {
	if ($(this).attr('valid') === '0' && $(this).val().trim().length !== 0) {
		if ($('#phone').attr('valid') === '0') 
			$(this).siblings('i.error').css('visibility', 'visible');
		else 
			$(this).siblings('i.error').css('visibility', 'hidden');
	} else 
		$(this).siblings('i.error').css('visibility', 'hidden');
});


// Phone Fields
$('form').on('input', '#phone_code, #phone_number', function() {
	if (phoneCheck.test($('input#phone_code').val().trim()) && phoneCheck.test($('input#phone_number').val().trim())) {
		$('#phone').val('+' + $('input#phone_code').val().trim() + ' ' + $('input#phone_number').val().trim());
		$('#phone').attr('valid', '1');
		$('input[name="enquiry[email]"]').attr('valid', '1');
	} else {
		$('#phone').val('');
		if (emailCheck.test($('input[name="enquiry[email]"]').val().trim())) {
			$('input[name="enquiry[email]"]').attr('valid', '1');
			$('#phone').attr('valid', '1');
		} else {
			$('input[name="enquiry[email]"]').attr('valid', '0');
			$('#phone').attr('valid', '0');
		}
	}
	
	if ($('form').find('[valid=0]').length > 0) $(':submit').prop('disabled', true)
	else $(':submit').prop('disabled', false);
});
$('form').on('change', '#phone_code, #phone_number', function() {
	if ($('#phone_code').val().trim().length === 0 && $('#phone_number').val().trim().length === 0) {
		$(this).siblings('i.error').css('visibility', 'hidden');
		return;
	};
	
	if (($('#phone_code').val().trim().length === 0 || $('#phone_number').val().trim().length === 0) && $('#phone').attr('valid') === '0') {
		if ($('[name="enquiry[email]"]').attr('valid') === '0' && !$('#phone_number').is(':focus'))
			$(this).siblings('i.error').css('visibility', 'visible');
		else 
			$(this).siblings('i.error').css('visibility', 'hidden');
	} else 
		$(this).siblings('i.error').css('visibility', 'hidden');
});

$('form').on('input', '#phone_code', function() {
	if ($(this).val().length >= 3) {
		$('#phone_number').focus();
	}
});
$('form').on('keydown', '#phone_number', function(e) {
	if ($(this).val().length === 0 && e.keyCode === 8) {
		$('#phone_code').focus();
	}
});


// Message Field
$('form').on('input', '[name="enquiry[message]"]', function() {
	if ($(this).val().trim().length > 0 && $(this).val().trim().length < 1000) $(this).attr('valid', '1');
	else $(this).attr('valid', '0');

	if ($('form').find('[valid=0]').length > 0) $(':submit').prop('disabled', true);
	else $(':submit').prop('disabled', false);
});
$('form').on('change', '[name="enquiry[message]"]', function() {
	if ($(this).attr('valid') === '0' && $(this).val().trim().length !== 0) 
		$(this).siblings('i.error').css('visibility', 'visible');
	else $(this).siblings('i.error').css('visibility', 'hidden');
});


$(document).ready(function() {
	var enq_form = $('#enquiry-form');
	enq_form.submit(function (ev) {
		$('.error').css('visibility', 'hidden');
		$('input[type="submit"]').prop('disabled', true);
		$.ajax({
			type: 'post',
			url: '/enquiries/add_enquiry',
			dataType: 'json',
			data: enq_form.serialize(),
			success: function(response) {
				enq_form.hide();
				
				if (response.success) {
					$('h2').text('Thank you').after($('<p>').text('we will be in touch shortly'));
				} else if (response.error) {
					$('h2').text('Oops...').after($('<p>').text(response.error + ' Refresh the page and try again'));
				}
			}
		});
		
		ev.preventDefault();
	});
});
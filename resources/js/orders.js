var showForm = function() {
	$('img.loader').hide();
	$('#order-form, .outside').fadeIn("slow");
//	$('#order-form, .outside').show();
};

$(document).ready(function() {
//	$.ajax({
//		type: 'POST',
//		url: 'http://redwood-formations.com/orders/get_jurisdictions/',
//		dataType: 'json',
//		success: function(response) {
//			
//		}
//	});
	
	$('input, textarea, select:not(#vpsh-select)').attr('valid', '0');
	$('#order-value-per-share, select.not-required, input.not-required, textarea.not-required, .info-shares input, .info-shares textarea').attr('valid', '1');
	$('input:checkbox:not(#accept), input.posted').removeAttr('valid');
	$('input, textarea, select, a, .add-button').attr('tabindex', '-1');
	$('.slide').first().find('input, textarea, select, a').removeAttr('tabindex');
	
	for (var key in countries) 	$('#order_country').append('<option>' + countries[key] + '</option>');
	for (var day=1; day<=31; day++) $('.date-day').append('<option>' + day + '</option>');
	var months = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	for(var key in months) $('.date-month').append('<option>' + months[key] + '</option>');	
	for (var year = new Date().getFullYear(); year>=1898; year--) $('.date-year').append('<option>' + year + '</option>');
	
	var slider = $('.bxslider').bxSlider({
		mode: 'horizontal',
		slideWidth: 600,
		adaptiveHeight: true,
		infiniteLoop: false,
		slideSelector: '.slide',
		touchEnabled: false,
		pager: false,
		controls: false,
		onSliderLoad: function(currentIndex) {
			if (currentIndex === 0) $('#slider-prev').css('visibility', 'hidden');
		},
		onSlideBefore: function($slideElement, oldIndex, newIndex) {
			if (newIndex === 0) $('#slider-prev').css('visibility', 'hidden');
			else $('#slider-prev').css('visibility', 'visible');
		}
	});
	
	//
	$('.slide').first().on('change', 'input#accept', function() {
		if (this.checked) {
			$(this).attr('valid', '1');
			$('#error-list #accept-error').hide();
			valid();
		} else {
			$(this).attr('valid', '0');
			$('#error-list #accept-error').show();
			not_valid();
		}
	});
	
	// Click listener for error labels on the shareholder slide
	$('#error-list span').on('click', 'label[for]', function() {
		var _for = '.' + $(this).attr('for');
		$(_for).focus();
	});


	// Change listener for country select
	$('.slide').on('change', '#order_country', function() {
		var _check = false;
		for (var key in countries_without_pc) {
			if ($(this).val() === countries_without_pc[key]) {
				_check = true;
				break;
			}
		}

		if ($(this).val() !== '' && !_check) {
			if (!$('#order_post_code').is(':visible')) {
				$('#order_post_code').parents('tr').show();
			}
		} else {
			if ($('#order_post_code').is(':visible')) {
				$('#order_post_code').parents('tr').hide();
			}
			$('#order_post_code').val('');
		}
	});


	// Change listener for Value per Share fields
	$('.slide').on('change', '#vpsh-field, #vpsh-select', function() {
		if ($('#vpsh-select').val() === 'other') {
			$('#order-value-per-share').val($('#vpsh-field').val());
			$('#vpsh-field').focus();
		} else {
			$('#vpsh-field').val($('#vpsh-field').val().replace(/[^\d.,]/g, ''));
			if ($('#vpsh-field').val().length === 0) { 
				$('#vpsh-field').attr('valid', '0'); 
				$('.bx-next').attr('disabled', 'disabled');
			}
			$('#order-value-per-share').val($('#vpsh-field').val() + ' ' + $('#vpsh-select').val());
		}

		$.ajax({
			type: 'POST',
			url: 'http://redwood-formations.com/orders/add_order',
			data: $('#order-value-per-share').serialize()
		});
	});


	// Change listener for Date select fields
	$('.slide').on('change', 'select.date-field', function() {	
		var date = [], _parent, _siblings, _token;

		// set value to hidden input
		$(this).parent('td').find('.date-field').each(function() {
			date.push($(this).val());
		});
		$(this).siblings(':hidden:not(.input-div)').val(date.join(' '));

		if ($(this).parents('.one-owner').length) {
			_parent = $(this).parents('.one-owner');
			_siblings = '.one-director, .one-shareholder';
		} else if ($(this).parents('.one-shareholder').length) {
			_parent = $(this).parents('.one-shareholder');
			_siblings = '.one-director, .one-owner';
		} else if ($(this).parents('.one-director').length) {
			_parent = $(this).parents('.one-director');
			_siblings = '.one-owner, .one-shareholder';
		}

		_token = $(_parent).data('person_token');


		if (_token && $(this).attr('valid') === '1') {
			// hide select fields if person is posted 
			$(this).hide().siblings('select.date-field').hide();
			$(this).siblings('div').show().find('span').text($(this).siblings('input').val());

			// save data and update the same fields
			$.ajax({
				type: 'POST',
				url: 'http://redwood-formations.com/orders/update_person/' + _token,
				dataType: 'json',
				data: $(this).siblings('input').serialize(),
				success: function(response) {
					$(_siblings).each(function() {
						var _date = response['person']['date'].split(/\s/);
						if (_date.length === 3) {
							$($(this).find('[name="person[date]"]').siblings('select')[0]).val(_date[0]);
							$($(this).find('[name="person[date]"]').siblings('select')[1]).val(_date[1]);
							$($(this).find('[name="person[date]"]').siblings('select')[2]).val(_date[2]);

							$(this).find('[name="person[date]"]')
									.val(response['person']['date'])
									.siblings().find('span').html(response['person']['date']);
						}
					});
				}
			});
		}
	});


	// Blur listener for visible inputs and textareas on the person's blocks
	$('.slide').on('blur', 'input:not(:checkbox), textarea', function() {
		var _parent;
		if ($(this).parents('.one-owner').length) _parent = $(this).parents('.one-owner');
		else if ($(this).parents('.one-shareholder').length) _parent = $(this).parents('.one-shareholder');
		else if ($(this).parents('.one-director').length) _parent = $(this).parents('.one-director');

		if ($(_parent).data('person_token') && $(this).attr('valid') === '1') {
			$(this).hide().siblings().show();
			$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
		}
	});


	// Click listener for spans on the person's slides
	// Show fields 
	$('.slide').on('click', '.input-div, .textarea-div', function() {
		if ($(this).siblings('select.date-field').length > 0) {
			$(this).find('span').text('');
			$(this).hide().siblings('select.date-field').show();
		} else {
			$(this).find('span').text('');
			$(this).hide().siblings().show().focus();
		}
	});


	// Add change listener for posted fields on owner slide
	$('.slide').on('change', "[name*='person[']:not(:checkbox)", function() {
		var _parent, _siblings, _siblings_tab, _token;

		if ($(this).parents('.one-owner').length) {
			_parent = $(this).parents('.one-owner');
			_siblings = '.one-director, .one-shareholder';
			_siblings_tab = '#director-tabs, #shareholder-tabs';
		} else if ($(this).parents('.one-shareholder').length) {
			_parent = $(this).parents('.one-shareholder');
			_siblings = '.one-director, .one-owner';
			_siblings_tab = '#director-tabs, #owner-tabs';
		} else if ($(this).parents('.one-director').length) {
			_parent = $(this).parents('.one-director');
			_siblings = '.one-owner, .one-shareholder';
			_siblings_tab = '#owner-tabs, #shareholder-tabs';
		}

		_token = _parent.data('person_token');

		if (_token && $(this).attr('valid') === '1') {
			$.ajax({
				type: 'POST',
				url: 'http://redwood-formations.com/orders/update_person/' + _token,
				dataType: 'json',
				data: $(this).serialize(),
				success: function(response) {
					$(_siblings).each(function() {
						if ($(this).data('person_token') === _token) {
							for (var key in response['person']) {
								$(this).find('[name="person[' + key + ']"]')
										.val(response['person'][key])
										.attr('valid', '1')
										.siblings().find('span').html(response['person'][key].replace(/\n/g, "<br>"));

								if (key === 'name') {
									$(_siblings_tab).find('.tab').each(function() {
										if ($(this).data('person_token') === _token) {
											$(this).find('.tab-name').text(response['person'][key]);
										}
									});
								}
							}
						}
					});
				}
			});
			if ($(this).attr('name') === 'person[name]') {
				$(_parent).find('input:first-child').data('name', $(_parent).find('input:first-child').val());
			}
		}
	});
	
	
	// Add change listener for only order named fields
	$('.slide, #services-slide').on('change', '#second-jur, #second-pref-jur, [name*="order["]:not(:checkbox)', function() {
		if ($(this).attr('valid') === '1') {
			$.ajax({
				type: 'POST',
				url: 'http://redwood-formations.com/orders/add_order',
				data: $(this).serialize()
			});
		};
	});


	$('.slide').first().on('change', '#order_phone_code, #order_phone_number', function() {
		$.ajax({
			type: 'POST',
			url: 'http://redwood-formations.com/orders/add_order',
			data: $('[name="order[phone_number]"]').serialize()
		});
	});
	$('.slide').first().on('input', '#order_phone_code', function() {
		$('[name="order[phone_number]"]').val('+' + $('#order_phone_code').val() + ' ' + $('#order_phone_number').val());
		if ($(this).val().length >= 3) {
			$('#order_phone_number').focus();
		}
	});
	$('.slide').first().on('input', '#order_phone_number', function() {
		$('[name="order[phone_number]"]').val('+' + $('#order_phone_code').val() + ' ' + $('#order_phone_number').val());
	});
	$('.slide').first().on('keydown', '#order_phone_number', function(e) {
		if ($(this).val().length === 0 && e.keyCode === 8) {
			$('#order_phone_code').focus();
		}
	});
	
	
	// Show required not filled fields
	var show_errors = function() {
		var _field = slider.getCurrentSlideElement().find('[valid="0"]:not(:checkbox, :hidden)');
		var _for = ($(_field).attr('id')) ? $(_field).attr('id') : $(_field).attr('class');
		if ($(_field).length === 1) {
			_for = _for.replace('date-field', '').replace('date-day', '').replace('date-month', '').replace('date-year', '').replace(/\s+/g, '');
			$('p#error-list span').html('Field <label for="' + _for + '">' + fields[_for] + '</label> is remaining to fill.');
		} else if ($(_field).length > 1) {
			$('p#error-list span').html('Fields ');
			$(_field).each(function() {
				_for = ($(this).attr('id')) ? $(this).attr('id') : $(this).attr('class');
				_for = _for.replace('date-field', '').replace('date-day', '').replace('date-month', '').replace('date-year', '').replace(/\s+/g, '');
				$('p#error-list span').append('<label for="' + _for + '">' + fields[_for] + '</label>');
			});
			$('p#error-list span').append(' are remaining to fill.');
			$('p#error-list span label:not(:first-of-type, :last-of-type)').before(', ');
			$('p#error-list span label:last-of-type').before(' and ');
		} else {
			$('p#error-list span').empty();
		};
		
		var _persons_html = $('p#error-list #persons').html();
		if ($('p#error-list span').is(':empty')) $('p#error-list #persons').html(_persons_html.replace('Also, you', 'You'));
		else $('p#error-list #persons').html(_persons_html.replace('You', 'Also, you'));
	};
	
	
	// Show persons with not filled fields
	var show_persons = function(persons, whois) {
		var _name;
		if (whois === 'owner') _name = "New Ultimate Beneficial Owner";
		else if (whois === 'shareholder') _name = "New Shareholder";
		else if (whois === 'director') _name = "New Director";
		
		if ($(persons).length === 1) {
			_name = ($(persons[0]).find('[name$="[name]"]').val()) ? $(persons[0]).find('[name$="[name]"]').val() : _name;
			
			$('p#error-list #persons').html("You have to fill in fields in <label for='" + whois + ':' + $(persons[0]).data('person_token') + "'>" + _name + "</label>.");
		} else {
			$('p#error-list #persons').html("You have to fill in fields in ");
			$(persons).each(function() {
				var __name;
				__name = ($(this).find('[name$="[name]"]').val()) ? $(this).find('[name$="[name]"]').val() : _name;
				$('p#error-list #persons').append("<label for='" + whois + ':' + $(this).data('person_token') + "'>" + __name + "</label>");
			});
			$('p#error-list #persons').append('.');
			$('p#error-list #persons label:not(:first-of-type, :last-of-type)').before(', ');
			$('p#error-list #persons label:last-of-type').before(' and ');
		}
	};
	
	
	// Do this if current field valid
	var valid = function() {
		// For next button
		if (slider.getCurrentSlideElement().find('[valid="0"]').length !== 0) {
			show_errors();
			$('.bx-next').attr('disabled', 'disabled');
			if (slider.getCurrentSlideElement().attr('id') === 'owner-slide') {
				$('#add-owner-button').attr('disabled', 'disabled');
			} else if (slider.getCurrentSlideElement().attr('id') === 'shareholder-slide') {
				$('#add-shareholder-button').attr('disabled', 'disabled');
			} else if (slider.getCurrentSlideElement().attr('id') === 'director-slide') {
				$('#add-director-button').attr('disabled', 'disabled');
			}
		} else {
			$('p#error-list span').empty();
			$('.bx-next').removeAttr('disabled');
			if (slider.getCurrentSlideElement().attr('id') === 'owner-slide') {
				$('#add-owner-button').removeAttr('disabled');
			} else if (slider.getCurrentSlideElement().attr('id') === 'shareholder-slide') {
				$('#add-shareholder-button').removeAttr('disabled');
			} else if (slider.getCurrentSlideElement().attr('id') === 'director-slide') {
				$('#add-director-button').removeAttr('disabled');
			}
		}
	};
	
	
	// Do this if current field not valid
	var not_valid = function() {
		show_errors();
		$('.bx-next').attr('disabled', 'disabled');
		if (slider.getCurrentSlideElement().attr('id') === 'owner-slide') {
			$('#add-owner-button').attr('disabled', 'disabled');
		} else if (slider.getCurrentSlideElement().attr('id') === 'shareholder-slide') {
			$('#add-shareholder-button').attr('disabled', 'disabled');
		} else if (slider.getCurrentSlideElement().attr('id') === 'director-slide') {
			$('#add-director-button').attr('disabled', 'disabled');
		}
		
		$('.bx-next').attr('disabled', 'disabled');
		if (slider.getCurrentSlideElement().attr('id') === 'owner-slide') {
			$('#add-owner-button').attr('disabled', 'disabled');
		} else if (slider.getCurrentSlideElement().attr('id') === 'shareholder-slide') {
			$('#add-shareholder-button').attr('disabled', 'disabled');
		} else if (slider.getCurrentSlideElement().attr('id') === 'director-slide') {
			$('#add-director-button').attr('disabled', 'disabled');
		}
	};
	
	
	// Validation of multiple select
	multipleValid = function(currentItem) {
		var foo = [];

		$(currentItem).find($('option:selected')).each(function() {
			if ($(this).text() !== '') {
				foo.push($(this).text());
			}
		});

		if (foo.length !== 0) {
			$(currentItem).attr('valid', '1');
			valid();
			return true;
		} else {
			$(currentItem).attr('valid', '0');
			not_valid();
			return false;
		}

	};
	
	
	// Validation of number fields
	intValid = function(currentItem) {
		if (/^([0-9])+$/.test($(currentItem).val().trim())) {
			$(currentItem).attr('valid', '1');
			valid();
			return true;
		} else {
			$(currentItem).attr('valid', '0');
			not_valid();
			return false;
		}
	};
	
	
	// Validation of text fields
	textValid = function(currentItem) {
		var _parent_tab, _parent, _text;
		
		if ($(currentItem).prop('class') === 'ultimate_owner_name') {
				_parent_tab = $('#owner-tabs div.tab');
				_parent = $(currentItem).parents('div.one-owner');
				_text = 'New Ultimate Beneficial Owner';
			} else if ($(currentItem).prop('class') === 'shareholder_name') {
				_parent_tab = $('#shareholder-tabs div.tab');
				_parent = $(currentItem).parents('div.one-shareholder');
				_text = 'New Shareholder';
			}
			else if ($(currentItem).prop('class') === 'director_name') {
				_parent_tab = $('#director-tabs div.tab');
				_parent = $(currentItem).parents('div.one-director');
				_text = 'New Director';
			}
		
		if ($(currentItem).attr('id') === 'first-jur') {
			if ($(currentItem).val() === 'other') {
				$('#first-jur').attr('valid', '1').removeAttr('name');
				$('#second-jur').attr({valid: '0', name: 'order[jurisdiction]'}).css('display', 'inline-block');
				return;
			} else {
				$('#second-jur').attr('valid', '1').removeAttr('name').hide();
				$('#first-jur').attr({valid: '0', name: 'order[jurisdiction]'});
			}
		};
		
		if ($(currentItem).attr('id') === 'first-pref-jur') {
			if ($(currentItem).val() === 'other') {
				$('#first-pref-jur').attr('valid', '1').removeAttr('name');
				$('#second-pref-jur').attr({valid: '0', name: 'order[preferred_jurisdiction]'}).css('display', 'inline-block');
				return;
			} else {
				$('#second-pref-jur').attr('valid', '1').removeAttr('name').hide();
				$('#first-pref-jur').attr({valid: '0', name: 'order[preferred_jurisdiction]'});
			}
		};

		if ($(currentItem).val().trim().length > 0 && $(currentItem).val().trim().length <= parseInt($(currentItem).attr('maxlength'))) {
			$(currentItem).attr('valid', '1');
			valid();
			
			if ($(currentItem).prop('name') === 'person[name]') {
				$(_parent_tab).each(function () {
					if ($(this).data('person_token') === $(_parent).data('person_token')) {
						$(this).find('p.tab-name').text($(currentItem).val());
						return;
					}
				});
			}

			return true;
		} else {
			$(currentItem).attr('valid', '0');
			not_valid();
			
			if ($(currentItem).prop('name') === 'person[name]') {
				$(_parent_tab).each(function () {
					if ($(this).data('person_token') === $(_parent).data('person_token')) {
						$(this).find('p.tab-name').text(_text);
					}
				});
			}
			
			return false;
		}
	};
	
	
	// Validation of text areas
	textareaValid = function(currentItem) {
		if ($(currentItem).val().trim().length > 0) {
			$(currentItem).attr('valid', '1');
			valid();
			return true;
		} else {
			$(currentItem).attr('valid', '0');
			not_valid();
			return false;
		}
	};
	
	
	// Validation of phone fields
	phoneValid = function(currentItem) {	
		var phoneCheck = /^([0-9().\/\\\-\s]){1,}$/;
		if (phoneCheck.test($(currentItem).val().trim()) && $(currentItem).val().trim().length <= parseInt($(currentItem).attr('maxlength'))) {
			$(currentItem).addClass('not-required').attr('valid', '1');
			valid();
			return true;
		} else {
			$(currentItem).attr('valid', '0');
			not_valid();
			return false;
		}
	};
	
	
	// Validation of email fields
	emailValid = function(currentItem) {
		var emailCheck = /[^\x00-\x20()<>@,;:\\".[\]\x7f-\xff]+(?:\.[^\x00-\x20()<>@,;:\\".[\]\x7f-\xff]+)*\@[^\x00-\x20()<>@,;:\\".[\]\x7f-\xff]+(?:\.[^\x00-\x20()<>@,;:\\".[\]\x7f-\xff]+)+/i;
		if (emailCheck.test($(currentItem).val().trim())) {
			$(currentItem).addClass('not-required').attr('valid', '1');
			valid();
			return true;
		} else {
			$(currentItem).attr('valid', '0');
			not_valid();
			return false;
		}
	};
	
	
	// Click listener for the first checkbox on the directors slide 
	$('#director-slide').on('change', 'input.ds-same-fields', function() {
		var _token, _data = {};
		
		if ($('.one-director:visible').data('person_token')) {
			_token = $('.one-director:visible').data('person_token');
		}
		
		if (this.checked) {
			$('.one-director:visible .ds-same-table').show();
			$('.one-director:visible .ds-same-table').find('input, textarea').attr('valid', '0').val('').removeClass('not-required');
			
			if ($('.one-director:visible .ds-so-same-fields').prop('checked')) {
				$('#director-tabs div.tab.active p.person-roles').html('&nbsp;(Director, Shareholder, Ultimate Beneficial Owner)');
			} else {
				if ($('.one-director:visible .director_corporate').is('.active')) {
					$('#director-tabs div.tab.active p.person-roles').html('&nbsp;(Corporate Director, Shareholder)');
				} else {
					$('#director-tabs div.tab.active p.person-roles').html('&nbsp;(Director, Shareholder)');
				}
			}
			
			
			
			if (_token) {
				$('.one-director:visible .ds-same-table span').text('');
				$('.one-director:visible .ds-same-table').find('.input-div, .textarea-div').hide().siblings().show();

				// Add new block to the shareholder slide
				_data['person[shareholder]'] = 1;

				var _tab = $('#director-tabs div.tab.active');
				var _this = $(this).parents('div.one-director');
				var _this_sh = $(_this).clone().appendTo($('#shareholder-slide'));
				var _checked = $(_this).find('.ds-so-same-fields').is(':checked');
						
				$(_this_sh).removeClass('one-director').addClass('one-shareholder');
				$(_this_sh).hide();
				$(_this_sh).find('.director-first-row').appendTo($(_this_sh).find('.main-table'));
				$(_this_sh).find('.ds-same-fields:checkbox').parent().remove();
				$(_this_sh).find('.ds-same-table').remove();

				$(_this_sh).html($(_this_sh).html().replace(/(director_shareholder)/g, 'shareholder'));
				$(_this_sh).html($(_this_sh).html().replace(/(director)/g, 'shareholder'));
				$(_this_sh).html($(_this_sh).html().replace(/(Director)/g, 'Shareholder'));
				$(_this_sh).html($(_this_sh).html().replace(/(ds\-so\-same)/g, 'so-same'));
				$(_this_sh).data('person_token', _token);
				$(_this_sh).find('.so-same-fields').prop('checked', _checked);

				$(_this_sh).find('input').each(function() {
					var _attr_name = $(this).attr('name');
					$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
					$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
				});
				$(_this_sh).find('textarea').each(function() {
					var _attr_name = $(this).attr('name');
					$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
					$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
				});
				$(_this_sh).find('.date-day').val($(_this).find('.date-day').val());
				$(_this_sh).find('.date-month').val($(_this).find('.date-month').val());
				$(_this_sh).find('.date-year').val($(_this).find('.date-year').val());
				
				// Hide the natural/corporate toggle 
				$(_this_sh).find('.shareholder-person-toggle').hide();

				// Add tab to the shareholder slide
				var _tab_sh = $(_tab).clone().insertBefore($('button#add-shareholder-button')).data('person_token', _token).removeClass('active');
				$(_tab_sh).html($(_tab_sh).html().replace(/(director)/g, 'shareholder'));

				$('.delete-shareholder-button').show();
				
				$(_this_sh).find('.shareholder-first-row input').attr('valid', '1').val('').addClass('not-required').hide().siblings().show();
				$(_this_sh).find('.shareholder-first-row span').text('');
				
				$('#owner-tabs div.tab').each(function() {
					if ($(this).data('person_token') === _token) {
						if ($(_this).find('.ds-so-same-fields').prop('checked')) {
							$(this).find('p.person-roles').html('&nbsp;(Director, Shareholder, Ultimate Beneficial Owner)');
//						} else {
//							$(this).find('p.person-roles').html('&nbsp;(Director, Shareholder)');
						}
						return;
					}
				});
				
				$.ajax({
					type: 'POST',
					url: 'http://redwood-formations.com/orders/update_person/' + _token,
					dataType: 'json',
					data: _data
				});
			}
			
		} else {
			
			if ($('.one-director:visible .ds-so-same-fields').prop('checked')) {
				$('#director-tabs div.tab.active p.person-roles').html('&nbsp;(Director, Ultimate Beneficial Owner)');
			} else {
				$('#director-tabs div.tab.active p.person-roles').html('');
			}
			
			if (_token) {
				$('.one-director:visible .ds-same-table').find('input, textarea').hide().siblings().show();
				$('.one-director:visible .ds-same-table').find('input, textarea').each(function() {
					$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
				});

				_data['person[shareholder]'] = 0;
				_data['person[shares_issued]'] = '';
				
				// Remove block from the Shareholder slide
				if ($('#shareholder-tabs div.tab').length > 1) {
					$('#shareholder-tabs div.tab, .one-shareholder').each(function() {
						if ($(this).data('person_token') === _token) {
							$(this).remove();
							return;
						}
					});
					
					if (!$('#shareholder-tabs div.tab.active').length) {
						$('#shareholder-tabs div.tab').first().addClass('active');
						$('.one-shareholder').each(function() {
							if ($(this).data('person_token') === $('#shareholder-tabs div.tab.active').data('person_token')) {
								$(this).show();
								return;
							}
						});
					}
				} else {
					// Reset tab
					$('#shareholder-slide div.tab').removeData('person_token');
					$('#shareholder-slide div.tab').addClass('active');
					$('#shareholder-slide div.tab p.tab-name').html('New Shareholder');
					$('#shareholder-slide div.tab p.person-roles').html('');

					// Reset block
					$('.one-shareholder').removeData('person_token');
					$('.one-shareholder').find('.shareholder-person-toggle').show();
					$('.one-shareholder').find('input:not([name="person[date]"], [name="person[owner]"], :checkbox), textarea, select').each(function() { // New block
						if ($(this).parent('td').find('select.date-field').length > 0) {
							$(this).siblings('div').find('span').text('');
							$(this).siblings().hide();
							$(this).val('').show().attr({value: '', valid: 0}).show();
							$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
						} else {
							$(this).siblings().find('span').text('');
							$(this).siblings().hide();
							$(this).val('').attr({value: '', valid: 0}).show();
						}
					});

					// set checkbox false and hide the table
					$('.one-shareholder .so-same-fields').prop('checked', false);
					$('.one-shareholder .so-same-table').hide();
					$('.one-shareholder .so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');

					// set to the natural person
					$('.one-shareholder .shareholder_nature').addClass('active');
					$('.one-shareholder .shareholder_corporate').removeClass('active');
					$('.one-shareholder .so-same-fields').parent('p').show();

					$('.one-shareholder:visible .shareholder_name_label').text('Full Name');
					fields['shareholder_name'] ='Full Name';
					$('.one-shareholder:visible .shareholder_address_label').text('Residential Address');
					fields['shareholder_address'] ='Residential Address';
					$('.one-shareholder:visible .shareholder_registration_no_label').text('Passport No. and Place of Issue');
					fields['shareholder_registration_no'] ='Passport No. and Place of Issue';
					$('.one-shareholder:visible .shareholder_registration_date_label').text('Date of Birth');

					show_errors();

					$('.one-shareholder textarea').each(function() {
						$(this).height(48);
					});

					$('#shareholder-slide div.tab.active .delete-shareholder-button').hide();
				}
				
				$('#owner-tabs div.tab').each(function() {
					if ($(this).data('person_token') === _token) {
						if ($('.one-director:visible .ds-so-same-fields').prop('checked')) {
							$(this).find('p.person-roles').html('&nbsp;(Director, Ultimate Beneficial Owner)');
						}
						return;
					}
				});
				
				$.ajax({
					type: 'POST',
					url: 'http://redwood-formations.com/orders/update_person/' + _token,
					dataType: 'json',
					data: _data
				});
			}
			
			$('.one-director:visible .ds-same-table').hide();
			$('.one-director:visible .ds-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');

		}

		valid();
	});
		

	// Click listener for the FIRST checkbox on the shareholder slide 
	$('#director-slide').on('change', 'input.ds-so-same-fields', function() {
		var _token, _data = {};
		
		if ($('.one-director:visible').data('person_token')) {
			_token = $('.one-director:visible').data('person_token');
		}
		
		if (this.checked) {
			$('.one-director:visible .ds-so-same-table').show();
			$('.one-director:visible .ds-so-same-table').find('input, textarea').attr('valid', '0').val('').removeClass('not-required');
			
			if ($('.one-director:visible .ds-same-fields').prop('checked')) {
				$('#director-tabs div.tab.active p.person-roles').html('&nbsp;(Director, Shareholder, Ultimate Beneficial Owner)');
			} else {
				$('#director-tabs div.tab.active p.person-roles').html('&nbsp;(Director, Ultimate Beneficial Owner)');
			}
			
			if ($('.one-director:visible').data('person_token')) {
				$('.one-director:visible .ds-so-same-table span').text('');
				$('.one-director:visible .ds-so-same-table').find('.input-div, .textarea-div').hide().siblings().show();

				_data['person[owner]'] = 1;
			
				// Add new block to the owner slide
				var _tab = $('#director-tabs div.tab.active');
				var _this = $(this).parents('div.one-director');
				var _this_ow = $(_this).clone().appendTo($('#owner-slide'));
						
				$(_this_ow).removeClass('one-director').addClass('one-owner');
				$(_this_ow).hide();
				$(_this_ow).find('.director-second-row').appendTo($(_this_ow).find('.main-table'));
				$(_this_ow).find('.ds-same-fields:checkbox, .ds-so-same-fields:checkbox').parent().remove();
				$(_this_ow).find('.ds-same-table, .ds-so-same-table, .director-person-toggle').remove();

				$(_this_ow).html($(_this_ow).html().replace(/(director)/g, 'ultimate_owner'));
				$(_this_ow).html($(_this_ow).html().replace(/(Director)/g, 'Ultimate Beneficial Owner'));
				$(_this_ow).data('person_token', _token);

				$(_this_ow).find('input').each(function() {
					var _attr_name = $(this).attr('name');
					$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
					$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
				});
				$(_this_ow).find('textarea').each(function() {
					var _attr_name = $(this).attr('name');
					$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
					$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
				});
				$(_this_ow).find('.date-day').val($(_this).find('.date-day').val());
				$(_this_ow).find('.date-month').val($(_this).find('.date-month').val());
				$(_this_ow).find('.date-year').val($(_this).find('.date-year').val());

				// Add tab to the shareholder slide
				var _tab_ow = $(_tab).clone().insertBefore($('button#add-owner-button')).data('person_token', _token).removeClass('active');
				$(_tab_ow).html($(_tab_ow).html().replace(/(director)/g, 'owner'));

				$('.delete-owner-button').show();
				
				$(_this_ow).find('.ultimate_owner-second-row input, .ultimate_owner-second-row textarea').attr('valid', '1').val('').addClass('not-required').hide().siblings().show();
				$(_this_ow).find('.ultimate_owner-second-row span').text('');
				
				// set so-checkbox on the shareholder slide to checked && show the table
				$('.one-shareholder').each(function() {
					if ($(this).data('person_token') === _token) {
						$(this).find('.so-same-fields').prop('checked', true);
						$(this).find('.so-same-table').show();
//						$(this).find('.so-same-table').find('input, textarea').attr('valid', '0').val('').removeClass('not-required');
						$(this).find('.so-same-table').find('input, textarea').val('');
						$(this).find('.so-same-table span').text('');
//						$(this).find('.so-same-table').find('.input-div, .textarea-div').hide().siblings().show();
					}
				});
				
				$('#shareholder-tabs div.tab').each(function() {
					if ($(this).data('person_token') === _token) {
						if ($(_this).find('.ds-same-fields').prop('checked')) {
							$(this).find('p.person-roles').html('&nbsp;(Director, Shareholder, Ultimate Beneficial Owner)');
						} else {
							$(this).find('p.person-roles').html('&nbsp;(Director, Ultimate Beneficial Owner)');
						}
					}
				});
				
				$.ajax({
					type: 'POST',
					url: 'http://redwood-formations.com/orders/update_person/' + _token,
					dataType: 'json',
					data: _data
				});
			}
		
		} else {
			
			if ($('.one-director:visible .ds-same-fields').prop('checked')) {
				$('#director-tabs div.tab.active p.person-roles').html('&nbsp;(Director, Shareholder)');
			} else {
				$('#director-tabs div.tab.active p.person-roles').html('');
			}
			
			if ($('.one-director:visible').data('person_token')) {
				$('.one-director:visible .ds-so-same-table').find('input, textarea').hide().siblings().show();
				$('.one-director:visible .ds-so-same-table').find('input, textarea').each(function() {
					$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
				});

				_data['person[owner]'] = 0;
				_data['person[shares_held]'] = '';
				_data['person[source]'] = '';
				
				// Remove block from the Owner slide
				if ($('#owner-tabs div.tab').length > 1) {
					$('#owner-tabs div.tab, .one-owner').each(function() {
						if ($(this).data('person_token') === _token) {
							$(this).remove();
							return;
						}
					});
					
					if (!$('#owner-tabs div.tab.active').length) {
						$('#owner-tabs div.tab').first().addClass('active');
						$('.one-owner').each(function() {
							if ($(this).data('person_token') === $('#owner-tabs div.tab.active').data('person_token')) {
								$(this).show();
								return;
							}
						});
					}
					
				} else {
					// Reset tab
					$('#owner-slide div.tab').removeData('person_token');
					$('#owner-slide div.tab').addClass('active');
					$('#owner-slide div.tab p.tab-name').html('New Ultimate Beneficial Owner');
					$('#owner-slide div.tab p.person-roles').html('');

					// Reset block
					$('.one-owner').removeData('person_token');
					$('.one-owner').find('input:not([name="person[date]"]), textarea, select').each(function() { // New block
						if ($(this).parent('td').find('select.date-field').length > 0) {
							$(this).siblings('div').find('span').text('');
							$(this).siblings().hide();
							$(this).val('').show().attr({value: '', valid: 0}).show();
							$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
						} else {
							$(this).siblings().find('span').text('');
							$(this).siblings().hide();
							$(this).val('').attr({value: '', valid: 0}).show();
						}
						show_errors();
					});
					$('.one-owner textarea').each(function() {
						$(this).height(48);
					});

					$('#owner-slide div.tab.active .delete-owner-button').hide();
				}

				//Update director slide
				$('.one-shareholder').each(function() {
					if ($(this).data('person_token') === _token) {
						$(this).find('.so-same-fields').prop('checked', false);
						$(this).find('.so-same-table').find('input, textarea').hide().siblings().show();
						$(this).find('.so-same-table').find('input, textarea').each(function() {
							$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
						});

						$(this).find('.so-same-table').hide();
						$(this).find('.so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
					}
				});
				
				$('#shareholder-tabs div.tab').each(function() {
					if ($(this).data('person_token') === _token) {
						if ($('.one-director:visible .ds-same-fields').prop('checked')) {
							$(this).find('p.person-roles').html('&nbsp;(Director, Shareholder)');
						}
					}
				});
				
				$.ajax({
					type: 'POST',
					url: 'http://redwood-formations.com/orders/update_person/' + _token,
					dataType: 'json',
					data: _data
				});
			}
			
			$('.one-director:visible .ds-so-same-table').hide();
			$('.one-director:visible .ds-so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
		}
		
		valid();
	});
	
	
	// Click listener for the second checkbox on the directors slide 
	$('#shareholder-slide').on('change', 'input.so-same-fields', function() {
		var _token, _data = {};
		
		if ($('.one-shareholder:visible').data('person_token')) {
			_token = $('.one-shareholder:visible').data('person_token');
		}
		
		if (this.checked) {
			$('.one-shareholder:visible .so-same-table').show();
			$('.one-shareholder:visible .so-same-table').find('input, textarea').attr('valid', '0').val('').removeClass('not-required');
			$('#shareholder-tabs div.tab.active p.person-roles').html('&nbsp;(Shareholder, Ultimate Beneficial Owner)');
			
			$('.one-director').each(function() {
				if ($(this).data('person_token') === _token) {
					$('#shareholder-tabs div.tab.active p.person-roles').html('&nbsp;(Director, Shareholder, Ultimate Beneficial Owner)');
					$('#director-tabs div.tab').each(function() {
						if ($(this).data('person_token') === _token) {
							$(this).find('p.person-roles').html('&nbsp;(Director, Shareholder, Ultimate Beneficial Owner)');
						}
					});
				}
			});
				
			if ($('.one-shareholder:visible').data('person_token')) {
				$('.one-shareholder:visible .so-same-table span').text('');
				$('.one-shareholder:visible .so-same-table').find('.input-div, .textarea-div').hide().siblings().show();

				_data['person[owner]'] = 1;

				// Add new block to the owner slide
				var _tab = $('#shareholder-tabs div.tab.active');
				var _this = $(this).parents('div.one-shareholder');
				var _this_ow = $(_this).clone().appendTo($('#owner-slide'));

				$(_this_ow).removeClass('one-shareholder').addClass('one-owner');
				$(_this_ow).hide();
				$(_this_ow).find('.shareholder-second-row').appendTo($(_this_ow).find('.main-table'));
				$(_this_ow).find('.so-same-fields:checkbox').parent().remove();
				$(_this_ow).find('.so-same-table, .shareholder-first-row, .shareholder-person-toggle').remove();

				$(_this_ow).html($(_this_ow).html().replace(/(shareholder)/g, 'ultimate_owner'));
				$(_this_ow).html($(_this_ow).html().replace(/(Shareholder)/g, 'Ultimate Beneficial Owner'));
				$(_this_ow).data('person_token', _token);

				$(_this_ow).find('input').each(function() {
					var _attr_name = $(this).attr('name');
					$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
					$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
				});
				$(_this_ow).find('textarea').each(function() {
					var _attr_name = $(this).attr('name');
					$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
					$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
				});
				$(_this_ow).find('.date-day').val($(_this).find('.date-day').val());
				$(_this_ow).find('.date-month').val($(_this).find('.date-month').val());
				$(_this_ow).find('.date-year').val($(_this).find('.date-year').val());

				// Add tab to the shareholder slide
				var _tab_ow = $(_tab).clone().insertBefore($('button#add-owner-button')).data('person_token', _token).removeClass('active');
				$(_tab_ow).html($(_tab_ow).html().replace(/(shareholder)/g, 'owner'));
				$('.delete-owner-button').show();
				
				$(_this_ow).find('.ultimate_owner-second-row input, .ultimate_owner-second-row textarea').attr('valid', '1').val('').addClass('not-required').hide().siblings().show();
				$(_this_ow).find('.ultimate_owner-second-row span').text('');
				
				// set ds-so-checkbox on the director slide to checked && show the table
				$('.one-director').each(function() {
					if ($(this).data('person_token') === _token) {
						$(this).find('.ds-so-same-fields').prop('checked', true);
						$(this).find('.ds-so-same-table').show();
						$(this).find('.ds-so-same-table').find('input, textarea').attr('valid', '0').val('').removeClass('not-required');
						$(this).find('.ds-so-same-table span').text('');
//						$(this).find('.ds-so-same-table').find('.input-div, .textarea-div').hide().siblings().show();
					}
				});
				
				$('#director-tabs div.tab').each(function() {
					if ($(this).data('person)token') === _token) {
						$(this).find('p.person-roles').html('&nbsp;(Director, Shareholder, Ultimate Beneficial Owner)');
					}
				});
				
				$.ajax({
					type: 'POST',
					url: 'http://redwood-formations.com/orders/update_person/' + _token,
					dataType: 'json',
					data: _data
				});
			}

		} else {
			
			$('#shareholder-tabs div.tab.active p.person-roles').html('');
			$('.one-director').each(function() {
				if ($(this).data('person_token') === _token) {
					$('#shareholder-tabs div.tab.active p.person-roles').html('&nbsp;(Director, Shareholder)');
					$('#director-tabs div.tab').each(function() {
						if ($(this).data('person_token') === _token) {
							$(this).find('p.person-roles').html('&nbsp;(Director, Shareholder)');
						}
					});
				}
			});
			
			if ($('.one-shareholder:visible').data('person_token')) {
				$('.one-shareholder:visible .so-same-table').find('input, textarea').hide().siblings().show();
				$('.one-shareholder:visible .so-same-table').find('input, textarea').each(function() {
					$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
				});

				_data['person[owner]'] = 0;
				_data['person[shares_held]'] = '';
				_data['person[source]'] = '';
				
				// Remove block from the Owner slide
				if ($('#owner-tabs div.tab').length > 1) {
					$('#owner-tabs div.tab, .one-owner').each(function() {
						if ($(this).data('person_token') === _token) {
							$(this).remove();
							return;
						}
					});
					
					if (!$('#owner-tabs div.tab.active').length) {
						$('#owner-tabs div.tab').first().addClass('active');
						$('.one-owner').each(function() {
							if ($(this).data('person_token') === $('#owner-tabs div.tab.active').data('person_token')) {
								$(this).show();
								return;
							}
						});
					}
				} else {
					// Reset tab
					$('#owner-slide div.tab').removeData('person_token');
					$('#owner-slide div.tab').addClass('active');
					$('#owner-slide div.tab p.tab-name').html('New Ultimate Beneficial Owner');
					$('#owner-slide div.tab p.person-roles').html('');

					// Reset block
					$('.one-owner').removeData('person_token');
					$('.one-owner').find('input:not([name="person[date]"]), textarea, select').each(function() { // New block
						if ($(this).parent('td').find('select.date-field').length > 0) {
							$(this).siblings('div').find('span').text('');
							$(this).siblings().hide();
							$(this).val('').show().attr({value: '', valid: 0}).show();
							$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
						} else {
							$(this).siblings().find('span').text('');
							$(this).siblings().hide();
							$(this).val('').attr({value: '', valid: 0}).show();
						}
						show_errors();
					});
					$('.one-owner textarea').each(function() {
						$(this).height(48);
					});

					$('#owner-slide div.tab.active .delete-owner-button').hide();
				}
				
				//Update director slide
				$('.one-director').each(function() {
					if ($(this).data('person_token') === _token) {
						$(this).find('.ds-so-same-fields').prop('checked', false);
						$(this).find('.ds-so-same-table').find('input, textarea').hide().siblings().show();
						$(this).find('.ds-so-same-table').find('input, textarea').each(function() {
							$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
						});

						$(this).find('.ds-so-same-table').hide();
						$(this).find('.ds-so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
					}
				});
				
				$.ajax({
					type: 'POST',
					url: 'http://redwood-formations.com/orders/update_person/' + _token,
					dataType: 'json',
					data: _data
				});
			}

			$('.one-shareholder:visible .so-same-table').hide();
			$('.one-shareholder:visible .so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
			

		}
		
		valid();
	});
	
	
	// Click listener for natural person tab
	$('#director-slide, #shareholder-slide').on('click', '.director_nature, .shareholder_nature', function() {
		if ($(this).hasClass('active')) return;

		var _parent, _siblings, _token;

		if ($(this).parents('.one-director').length) {
			_parent = $(this).parents('.one-director');
			_siblings = '.one-shareholder';
		} else if ($(this).parents('.one-shareholder').length) {
			_parent = $(this).parents('.one-shareholder');
			_siblings = '.one-director';
		}

		if ($(_parent).data('person_token')) {
			var _data = {};
			_data['person[corporate]'] = 0;

			_token = $(_parent).data('person_token');

			$(_siblings).each(function() {
				if ($(this).data('person_token') === _token) {
					_siblings = $(this);
					return;
				}
			});
			
			$.ajax({
				type: 'POST',
				url: 'http://redwood-formations.com/orders/update_person/' + _token,
				dataType: 'json',
				data: _data
			});
			
			$('#shareholder-tabs div.tab').each(function() {
				if ($(this).data('person_token') === _token && $(this).find('p.person-roles').is(':not(:empty)')) {
					$(this).find('p.person-roles').html('&nbsp(Director, Shareholder)');
				}
			});

		}
		
		if ($('#director-tabs div.tab.active p.person-roles').is(':not(:empty)')) {
			$('#director-tabs div.tab.active p.person-roles').html('&nbsp(Director, Shareholder)');
		}
		
		_parent.add(_siblings).find('.director_nature, .shareholder_nature').addClass('active');
		_parent.add(_siblings).find('.director_nature, .shareholder_nature').siblings().removeClass('active');
		_parent.add(_siblings).find('.so-same-fields, .ds-so-same-fields').prop('checked', false).parent('p').show();

		_parent.add(_siblings).find('.director_name_label, .shareholder_name_label').text('Full Name');
		fields['director_name'] ='Full Name';
		fields['shareholder_name'] ='Full Name';
		_parent.add(_siblings).find('.director_address_label, .shareholder_address_label').text('Residential Address');
		fields['director_address'] ='Residential Address';
		fields['shareholder_address'] ='Residential Address';
		_parent.add(_siblings).find('.director_registration_no_label, shareholder_registration_no_label').text('Passport No. and Place of Issue');
		fields['director_registration_no'] ='Passport No. and Place of Issue';
		fields['shareholder_registration_no'] ='Passport No. and Place of Issue';
		_parent.add(_siblings).find('.director_registration_date_label, .shareholder_registration_date_label').text('Date of Birth');
		
		show_errors();
	});
	
	// Click listener for corporate director tab
	$('#director-slide, #shareholder-slide').on('click', '.director_corporate, .shareholder_corporate', function() {
		if ($(this).hasClass('active')) return;

		var _parent, _siblings, _token;

		if ($(this).parents('.one-director').length) {
			_parent = $(this).parents('.one-director');
			_siblings = '.one-shareholder';
			
			if (_parent.find('.ds-same-fields').is(':checked')) {
				$('#director-tabs div.tab.active p.person-roles').html('&nbsp(Corporate Director, Shareholder)');
			} else {
				$('#director-tabs div.tab.active p.person-roles').html('');
			}
		} else if ($(this).parents('.one-shareholder').length) {
			_parent = $(this).parents('.one-shareholder');
			_siblings = '.one-director';
		}

		if ($(_parent).data('person_token')) {
			var _data = {};
			_data['person[corporate]'] = 1;
			_data['person[owner]'] = 0;
			_data['person[shares_held]'] = '';
			_data['person[source]'] = '';

			_token = $(_parent).data('person_token');

			$(_siblings).each(function() {
				if ($(this).data('person_token') === _token) {
					_siblings = $(this);
					return;
				}
			});

			$('#shareholder-tabs div.tab').each(function() {
				if ($(this).data('person_token') === _token) {
					$(this).find('p.person-roles').html($('#director-tabs div.tab.active p.person-roles').html());
				}
			});
			
			// Remove block from the Owner slide
			if ($('#owner-tabs div.tab').length > 1) {
				$('#owner-tabs div.tab, .one-owner').each(function() {
					if ($(this).data('person_token') === _token) {
						$(this).remove();
						return;
					}
				});

				if (!$('#owner-tabs div.tab.active').length) {
					$('#owner-tabs div.tab').first().addClass('active');
					$('.one-owner').each(function() {
						if ($(this).data('person_token') === $('#owner-tabs div.tab.active').data('person_token')) {
							$(this).show();
							return;
						}
					});
				}
			} else {
				// Reset tab
				$('#owner-slide div.tab').removeData('person_token');
				$('#owner-slide div.tab').addClass('active');
				$('#owner-slide div.tab p.tab-name').html('New Ultimate Beneficial Owner');
				$('#owner-slide div.tab p.person-roles').html('');

				// Reset block
				$('.one-owner').removeData('person_token');
				$('.one-owner').find('input:not([name="person[date]"]), textarea, select').each(function() { // New block
					if ($(this).parent('td').find('select.date-field').length > 0) {
						$(this).siblings('div').find('span').text('');
						$(this).siblings().hide();
						$(this).val('').show().attr({value: '', valid: 0}).show();
						$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
					} else {
						$(this).siblings().find('span').text('');
						$(this).siblings().hide();
						$(this).val('').attr({value: '', valid: 0}).show();
					}
					show_errors();
				});
				$('.one-owner textarea').each(function() {
					$(this).height(48);
				});

				$('#owner-slide div.tab.active .delete-owner-button').hide();
			}
			
			$.ajax({
				type: 'POST',
				url: 'http://redwood-formations.com/orders/update_person/' + _token,
				dataType: 'json',
				data: _data
			});

		}

		// if (slider.getCurrentSlideElement().find('[valid="0"]:not(:checkbox):not(:hidden)').length > 0) {
		// 	$('.bx-next').attr('disabled', 'disabled');
		// } else {
		// 	$('.bx-next').removeAttr('disabled');
		// }

		_parent.add(_siblings).find('.director_corporate, .shareholder_corporate').addClass('active');
		_parent.add(_siblings).find('.director_corporate, .shareholder_corporate').siblings().removeClass('active');
		_parent.add(_siblings).find('.ds-so-same-fields, .so-same-fields').parent('p').hide();
		if (_parent.add(_siblings).find('.ds-so-same-table, .so-same-table').is(':visible')) {
			_parent.add(_siblings).find('.ds-so-same-fields, .so-same-fields').prop('checked', false);
			_parent.add(_siblings).find('.ds-so-same-table, .so-same-table').find('input, textarea').val('').attr('valid', '1');
			_parent.add(_siblings).find('.ds-so-same-table, .so-same-table').hide();
		}

		_parent.add(_siblings).find('.director_name_label, .shareholder_name_label').text('Company Name');
		_parent.add(_siblings).find('.director_address_label, .shareholder_address_label').text('Registered Office Address');
		_parent.add(_siblings).find('.director_registration_no_label, .shareholder_registration_no_label').text('Registration No. and Country of Registration');
		_parent.add(_siblings).find('.director_registration_date_label, .shareholder_registration_date_label').text('Date of Registration');
		
		fields['director_name'] ='Company Name';
		fields['shareholder_name'] ='Company Name';
		fields['director_address'] ='Registered Office Address';
		fields['shareholder_address'] ='Registered Office Address';
		fields['director_registration_no'] ='Registration No. and Country of Registration';
		fields['shareholder_registration_no'] ='Registration No. and Country of Registration';
		show_errors();
	});


	// Before owner delete function 
	function before_owner_delete() {
		// focus on non-deleted tab
		$('#owner-slide div.tab').removeClass('active');
		$('#owner-slide div.tab:not(.owner-deleted)').last().addClass('active');
		if ($('#owner-slide div.tab:not(.owner-deleted)').length === 1) {
			$('#owner-slide div.tab.active p.delete-owner-button').hide();
		}
		// show block
		$('.one-owner').hide();
		$('.one-owner').each(function() {
			if ($(this).data('person_token') === $('#owner-slide div.tab.active').data('person_token')) {
				$(this).show();
				show_errors();
			}
		});
	}


	// Add click listener for delete owner button
	$('#owner-slide').on('click', 'p.delete-owner-button', function() {
		var _token = $(this).parent('div.tab').data('person_token'), _check = true;
		var _this = $(this);

		if ($(this).parent('div.tab').hasClass('owner-deleted')) {
			// changing tabs
			$(this).parents('div.tab').removeClass('owner-deleted');
			$(this).text('delete');
			
			$(this).siblings('p.tab-name').removeClass('deleted');
			if ($(this).siblings('p.person-roles').find('.deleted').length) {
				$(this).siblings('p.person-roles').html($(this).siblings('p.person-roles')
						.html().replace('<span class="deleted">Ultimate Beneficial Owner</span>', 'Ultimate Beneficial Owner'));
			}
			// enabling buttons
			if ($('#owner-slide').find('[valid="0"]').length === 0) {
				$('#add-owner-button, .bx-next').removeAttr('disabled');
			}
		} else {
			if ($('#owner-slide div.tab:not(.owner-deleted)').length === 1) {
				return;
			} else {
				if (_token) {			
					// set tab as deleted
					$(this).parent('div.tab').addClass('owner-deleted');
					$(this).text('Cancel');
					
					if ($(this).siblings('p.person-roles').is(':empty')) {
						$(this).siblings('p.tab-name').addClass('deleted');
					} else {
						$('.one-owner').each(function() {
							if ($(this).data('person_token') === _token) {
								$(_this).siblings('p.person-roles').html($(_this).siblings('p.person-roles')
										.html().replace('Ultimate Beneficial Owner', '<span class="deleted">Ultimate Beneficial Owner</span>'));
//								_check = false;
								return;
							}
						});
						
//						if (_check) $(this).siblings('p.tab-name, p.person-roles').addClass('deleted');						
					}
					
					before_owner_delete();
				} else {
					// Delete block and tab
					$('.one-owner').each(function() {
						if ($(this).data('person_token') === _token) {
							if ($(this).find('[valid=1]:not(.not-required)').length !== 0) {
								// set tab as deleted
								$(_this).parent('div.tab').addClass('owner-deleted');
								$(_this).siblings('p.tab-name').addClass('deleted'); 
								$(_this).text('Cancel');
							} else {
								$(_this).parent('div.tab').remove();
								$(this).remove();
							}
						}
					});

					before_owner_delete();

					// Enable add and next buttons
					$('#add-owner-button, .bx-next').removeAttr('disabled');
				}
			}
		}

		if ($('#owner-slide div.tab:not(.owner-deleted)').length === 1) {
			$('#owner-slide div.tab.active .delete-owner-button').hide();
		} else {
			$('#owner-slide div.tab:not(.owner-deleted)').find('.delete-owner-button').show();
		}
	});
	
	
	// Add click listener for add owner button
	$('#owner-slide').on('click', 'button#add-owner-button', function() {
		if ($('.one-owner:visible').find('[valid="0"]').length !== 0) {
			return false;
		} 

		var _this = null;

		$('#owner-slide .one-owner').each(function() {
			if (!$(this).data('person_token')) _this = $(this);
		});

		if (_this !== null) {
			// Post data from visible block
			$.ajax({
				type: 'POST',
				url: 'http://redwood-formations.com/orders/add_person/owner',
				dataType: 'json',
				data: $(_this).find('input, textarea').serialize()
			}).done(function(response) {
				// Set owner id for tab and block
				$(_this).data('person_token', response.person_token);
				$('#owner-slide div.tab').each(function() {
					if (!$(this).data('person_token')) $(this).data('person_token', response.person_token);
				});

				// Add new tab
				$('#owner-slide div.tab').removeClass('active');
				$('<div class="tab active"><p class="tab-name">New Ultimate Beneficial Owner</p><p class="person-roles"></p><p class="delete-owner-button">delete</p></div>').insertBefore($('button#add-owner-button'));
				$('#owner-slide p.delete-owner-button').show();

				// Disable all inputs and textareas before hide this block
				$(_this).find('input:not([name="person[date]"]), textarea, select').each(function() {
					if ($(this).parent('td').find('select.date-field').length > 0) {
						$(this).hide().siblings('select.date-field').hide();
						$(this).siblings('div').show();
						$(this).siblings('div').find('span').html($(this).siblings('input:hidden').val());
					} else {
						$(this).hide().siblings().show();
						$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
					}

				});
				// Add new block
				$('.one-owner:visible').hide();
				$(_this).hide().clone().appendTo($('#owner-slide')).show(); // Old block
				$('.one-owner:visible').find('input:not([name="person[date]"]), textarea, select').each(function() { // New block
					if ($(this).parent('td').find('select.date-field').length > 0) {
						$(this).siblings('div').find('span').text('');
						$(this).siblings().hide();
						$(this).val('').attr({value: '', valid: 0}).show();
						$(this).siblings('select').val('').attr({value: '', valid: 0}).show();
					} else {
						$(this).siblings().find('span').text('');
						$(this).siblings().hide();
						$(this).val('').attr({value: '', valid: 0}).show();
					}
					show_errors();
				});
				$('.one-owner:visible textarea').each(function() {
					$(this).height(48);
				});

				if ($('#owner-slide div.tab:not(.owner-deleted)').length === 1) {
					$('#owner-slide div.tab.active .delete-owner-button').hide();
				} else {
					$('#owner-slide div.tab:not(.owner-deleted)').find('.delete-owner-button').show();
				}
			});
		} else {
			// Add new tab
			$('#owner-slide div.tab').removeClass('active');
			$('<div class="tab active"><p class="tab-name">New Ultimate Beneficial Owner</p><p class="person-roles"></p><p class="delete-owner-button">delete</a></div>').insertBefore($('button#add-owner-button'));
			$('#owner-slide p.delete-owner-button').show();

			// Add new block
			$('.one-owner:visible').hide().clone().appendTo($('#owner-slide')).show(); // Old block
			$('.one-owner:visible').find('input:not([name="person[date]"]), textarea, select').each(function() { // New block
				if ($(this).parent('td').find('select.date-field').length > 0) {
					$(this).siblings('div').find('span').text('');
					$(this).siblings().hide();
					$(this).val('').show().attr({value: '', valid: 0}).show();
					$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
				} else {
					$(this).siblings().find('span').text('');
					$(this).siblings().hide();
					$(this).val('').attr({value: '', valid: 0}).show();
				}
				show_errors();
			});
			$('.one-owner:visible textarea').each(function() {
				$(this).height(48);
			});

			if ($('#owner-slide div.tab:not(.owner-deleted)').length === 1) {
				$('#owner-slide div.tab.active .delete-owner-button').hide();
			} else {
				$('#owner-slide div.tab:not(.owner-deleted)').find('.delete-owner-button').show();
			}
		}


		// Disable add button and next button
		$('#add-owner-button, .bx-next').attr('disabled', 'disabled');
		return false;
	});
	
	
	// Add click listener for owner tabs
	$('#owner-slide').on('click', 'div.tab:not(.owner-deleted) p.tab-name, div.tab:not(.owner-deleted) p.person-roles', function() {
		var _self = $(this).parents('div.tab');
		$('#owner-slide div.tab').removeClass('active');
		$(this).parents('div.tab').addClass('active');
		$('.one-owner:visible').hide();
		$('.one-owner').each(function() {
			if ($(this).data('person_token') === _self.data('person_token')) {
				$(this).show();
				show_errors();
				return;
			}
		});
		var persons = [];
		$('.one-owner:not(:visible)').each(function() {
			if ($(this).find('[valid="0"]').length !== 0) {
				var _token = $(this).data('person_token'), _this = $(this);
				$('#owner-tabs div.tab:not(.owner-deleted)').each(function() {
					if ($(this).data('person_token') === _token) {
						persons.push($(_this));
						return;
					}
				});
				
			}
		});
		if ($(persons).length > 0) {
			show_persons(persons, 'owner');
			var _persons_html = $('p#error-list #persons').html();
			if ($('p#error-list span').is(':empty')) $('p#error-list #persons').html(_persons_html.replace('Also, you', 'You'));
			else $('p#error-list #persons').html(_persons_html.replace('You', 'Also, you'));
		} else 
			$('p#error-list #persons').empty();
	});
	
	
	// Before shareholder delete function 
	function before_shareholder_delete() {
		// focus on non-deleted tab
		$('#shareholder-slide div.tab').removeClass('active');
		$('#shareholder-slide div.tab:not(.shareholder-deleted)').last().addClass('active');
		if ($('#shareholder-slide div.tab:not(.shareholder-deleted)').length === 1) {
			$('#shareholder-slide div.tab.active p.delete-shareholder-button').hide();
		}
		// show block
		$('.one-shareholder').hide();
		$('.one-shareholder').each(function() {
			if ($(this).data('person_token') === $('#shareholder-slide div.tab.active').data('person_token')) {
				$(this).show();
				show_errors();
			}
		});
	}


	// Add click listener for delete shareholder button
	$('#shareholder-slide').on('click', 'p.delete-shareholder-button', function() {
		var _token = $(this).parent('div.tab').data('person_token'), _check = true;
		var _this = $(this);
		
		if ($(this).parent('div.tab').hasClass('shareholder-deleted')) {
			// changing tabs
			$(this).parents('div.tab').removeClass('shareholder-deleted');
			$(this).text('delete');
			
			$(this).siblings('p.tab-name, p.person-roles').removeClass('deleted');
			if ($(this).siblings('p.person-roles').find('.deleted').length) {
				$(this).siblings('p.person-roles').html($(this).siblings('p.person-roles')
						.html().replace('<span class="deleted">Shareholder</span>', 'Shareholder'));
			}
			
			// enabling buttons
			if ($('#shareholder-slide').find('[valid="0"]').length === 0) {
				$('#add-shareholder-button, .bx-next').removeAttr('disabled');
			}
		} else {
			if ($('#shareholder-slide div.tab:not(.shareholder-deleted)').length === 1) {
				return;
			} else {
				if (_token) {			
					// set tab as deleted
					$(this).parent('div.tab').addClass('shareholder-deleted');
					$(this).text('Cancel');
					
					if ($(this).siblings('p.person-roles').is(':empty')) {
						$(this).siblings('p.tab-name').addClass('deleted');
					} else {
						$('.one-director').each(function() {
							if ($(this).data('person_token') === _token) {
								$(_this).siblings('p.person-roles').html($(_this).siblings('p.person-roles')
										.html().replace('Shareholder', '<span class="deleted">Shareholder</span>'));
								_check = false;
								return;
							}
						});
						
						if (_check) $(this).siblings('p.tab-name, p.person-roles').addClass('deleted');						
					}
					
					before_shareholder_delete();
				} else {
					// Delete block and tab
					$('.one-shareholder').each(function() {
						if ($(this).data('person_token') === $(_this).parent('div.tab').data('person_token')) {
							if ($(this).find('[valid=1]:not(.not-required)').length) {
								// set tab as deleted
								$(_this).parent('div.tab').addClass('shareholder-deleted');
								$(_this).siblings('p.tab-name, p.person-roles').addClass('deleted');
								$(_this).text('Cancel');
							} else {
								$(_this).parent('div.tab').remove();
								$(this).remove();
							}
						}
					});

					before_shareholder_delete();

					// Enable add and next buttons
					$('#add-shareholder-button, .bx-next').removeAttr('disabled');
				}
			}
		}

		if ($('#shareholder-slide div.tab:not(.shareholder-deleted)').length === 1) {
			$('#shareholder-slide div.tab.active .delete-shareholder-button').hide();
		} else {
			$('#shareholder-slide div.tab:not(.shareholder-deleted)').find('.delete-shareholder-button').show();
		}
	});
	
	
	// Add click listener for add shareholder button
	$('#shareholder-slide').on('click', 'button#add-shareholder-button', function() {
		if ($('.one-shareholder:visible').find('[valid="0"]').length !== 0) {
			return false;
		} 
		
		var _this = null;

		$('#shareholder-slide .one-shareholder').each(function() {
			if (!$(this).data('person_token')) _this = $(this);
		});

		if (_this !== null) {
			var _corp = '';
			if ($(_this).find('.shareholder_corporate').hasClass('active')) {
				_corp = '/1';
			}
			$.ajax({
				type: 'POST',
				url: 'http://redwood-formations.com/orders/add_person/shareholder' + _corp,
				dataType: 'json',
				data: $(_this).find('input, textarea').serialize()
			}).done(function(response) {
				var _name = $(_this).find('input.shareholder_name').val();
				var _tab;
				// Set shareholder id for tab and block
				$(_this).data('person_token', response.person_token);
				$('#shareholder-slide div.tab').each(function() {
					if (!$(this).data('person_token')) {
						$(this).data('person_token', response.person_token);
						_tab = $(this);
					}
				});

				// Add new tab
				$('#shareholder-slide div.tab').removeClass('active');
				$('<div class="tab active"><p class="tab-name">New Shareholder</p><p class="person-roles"></p><p class="delete-shareholder-button">delete</p></div>').insertBefore($('button#add-shareholder-button'));
				$('#shareholder-slide p.delete-shareholder-button').show();

				// Disable all inputs and textareas before hide this block			
				$(_this).find('input:not([name="person[date]"], [name="person[owner]"], :checkbox), textarea, select').each(function() {
					if ($(this).parent('td').find('select.date-field').length > 0) {
						$(this).hide().siblings('select.date-field').hide();
						$(this).siblings('div').show();
						$(this).siblings('div').find('span').html($(this).siblings('input:hidden').val());
					} else {
						$(this).hide().siblings().show();
						$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
					}

				});

				// Add new block
				$('.one-shareholder:visible').hide();
				$(_this).hide().clone().appendTo($('#shareholder-slide')).show(); // Old block
				$('.one-shareholder:visible').find('input:not([name="person[date]"], [name="person[owner]"], :checkbox), textarea, select').each(function() { // New block
					if ($(this).parent('td').find('select.date-field').length > 0) {
						$(this).siblings('div').find('span').text('');
						$(this).siblings().hide();
						$(this).val('').attr({value: '', valid: 0}).show();
						$(this).siblings('select').val('').attr({value: '', valid: 0}).show();
					} else {
						$(this).siblings().find('span').text('');
						$(this).siblings().hide();
						$(this).val('').attr({value: '', valid: 0}).show();
					}
				});
				
				// set checkbox false and hide the table
				$('.one-shareholder:visible .so-same-fields').prop('checked', false);
				$('.one-shareholder:visible .so-same-table').hide();
				$('.one-shareholder:visible .so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');

				// set to the natural person
				$('.one-shareholder:visible .shareholder_nature').addClass('active');
				$('.one-shareholder:visible .shareholder_corporate').removeClass('active');
				$('.one-shareholder:visible .so-same-fields').parent('p').show();

				$('.one-shareholder:visible .shareholder_name_label').text('Full Name');
				fields['shareholder_name'] ='Full Name';
				$('.one-shareholder:visible .shareholder_address_label').text('Residential Address');
				fields['shareholder_address'] ='Residential Address';
				$('.one-shareholder:visible .shareholder_registration_no_label').text('Passport No. and Place of Issue');
				fields['shareholder_registration_no'] ='Passport No. and Place of Issue';
				$('.one-shareholder:visible .shareholder_registration_date_label').text('Date of Birth');

				show_errors();
					
				$('.one-shareholder:visible textarea').each(function() {
					$(this).height(48);
				});

				if ($('#shareholder-slide div.tab:not(.shareholder-deleted)').length === 1) {
					$('#shareholder-slide div.tab.active .delete-shareholder-button').hide();
				} else {
					$('#shareholder-slide div.tab:not(.shareholder-deleted)').find('.delete-shareholder-button').show();
				}
				
				if ($(_this).find('.so-same-fields:checkbox').is(':checked')) {
					// Add Block to the shareholder slide
					var _this_ow = $(_this).clone().appendTo($('#owner-slide'));
					
					$(_this_ow).removeClass('one-shareholder').addClass('one-owner');
					$(_this_ow).hide();
					$(_this_ow).find('.shareholder-second-row').appendTo($(_this_ow).find('.main-table'));
					$(_this_ow).find('.so-same-fields:checkbox').parent().remove();
					$(_this_ow).find('.so-same-table, .shareholder-first-row, .shareholder-person-toggle').remove();
					
					$(_this_ow).html($(_this_ow).html().replace(/(shareholder)/g, 'ultimate_owner'));
					$(_this_ow).html($(_this_ow).html().replace(/(Shareholder)/g, 'Ultimate Beneficial Owner'));
					$(_this_ow).data('person_token', response.person_token);
					
					$(_this_ow).find('input').each(function() {
						var _attr_name = $(this).attr('name');
						$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
						$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
					});
					$(_this_ow).find('textarea').each(function() {
						var _attr_name = $(this).attr('name');
						$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
						$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
					});
					$(_this_ow).find('.date-day').val($(_this).find('.date-day').val());
					$(_this_ow).find('.date-month').val($(_this).find('.date-month').val());
					$(_this_ow).find('.date-year').val($(_this).find('.date-year').val());
					
					// Add tab to the shareholder slide
					var _tab_ow = $(_tab).clone().insertBefore($('button#add-owner-button')).data('person_token', response.person_token);
					$(_tab_ow).html($(_tab_ow).html().replace(/(shareholder)/g, 'owner'));
					
					$('.delete-owner-button').show();
				}
			});
		} else {
			// Add new tab
			$('#shareholder-slide div.tab').removeClass('active');
			$('<div class="tab active"><p class="tab-name">New Shareholder</p><p class="person-roles"></p><p class="delete-shareholder-button">delete</a></div>').insertBefore($('button#add-shareholder-button'));
			$('#shareholder-slide p.delete-shareholder-button').show();

			// Add new block
			$('.one-shareholder:visible').hide().clone().appendTo($('#shareholder-slide')).show(); // Old block
			$('.one-shareholder:visible').find('input:not([name="person[date]"], [name="person[owner]"], :checkbox), textarea, select').each(function() { // New block
				if ($(this).parent('td').find('select.date-field').length > 0) {
					$(this).siblings('div').find('span').text('');
					$(this).siblings().hide();
					$(this).val('').show().attr({value: '', valid: 0}).show();
					$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
				} else {
					$(this).siblings().find('span').text('');
					$(this).siblings().hide();
					$(this).val('').attr({value: '', valid: 0}).show();
				}
			});
			
			// set checkbox false and hide the table
			$('.one-shareholder:visible .so-same-fields').prop('checked', false);
			$('.one-shareholder:visible .so-same-table').hide();
			$('.one-shareholder:visible .so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');

			// set to the natural person
			$('.one-shareholder:visible .shareholder_nature').addClass('active');
			$('.one-shareholder:visible .shareholder_corporate').removeClass('active');
			$('.one-shareholder:visible .so-same-fields').parent('p').show();

			$('.one-shareholder:visible .shareholder_name_label').text('Full Name');
			fields['shareholder_name'] ='Full Name';
			$('.one-shareholder:visible .shareholder_address_label').text('Residential Address');
			fields['shareholder_address'] ='Residential Address';
			$('.one-shareholder:visible .shareholder_registration_no_label').text('Passport No. and Place of Issue');
			fields['shareholder_registration_no'] ='Passport No. and Place of Issue';
			$('.one-shareholder:visible .shareholder_registration_date_label').text('Date of Birth');

			show_errors();
				
			$('.one-shareholder:visible textarea').each(function() {
				$(this).height(48);
			});

			if ($('#shareholder-slide div.tab:not(.shareholder-deleted)').length === 1) {
				$('#shareholder-slide div.tab.active .delete-shareholder-button').hide();
			} else {
				$('#shareholder-slide div.tab:not(.shareholder-deleted)').find('.delete-shareholder-button').show();
			}
		}


		// Disable add button and next button
		$('#add-shareholder-button, .bx-next').attr('disabled', 'disabled');
		return false;
	});
	
	
	// Add click listener for shareholder tabs
	$('#shareholder-slide').on('click', 'div.tab:not(.shareholder-deleted) p.tab-name, div.tab:not(.shareholder-deleted) p.person-roles', function() {
		var _self = $(this).parents('div.tab');
		$('#shareholder-slide div.tab').removeClass('active');
		$(this).parents('div.tab').addClass('active');
		$('.one-shareholder:visible').hide();
		$('.one-shareholder').each(function() {
			if ($(this).data('person_token') === _self.data('person_token')) {
				$(this).show();
				show_errors();
				return;
			}
		});
		var persons = [];
		$('.one-shareholder:not(:visible)').each(function() {
			if ($(this).find('[valid="0"]').length !== 0) {
				var _token = $(this).data('person_token'), _this = $(this);
				$('#shareholder-tabs div.tab:not(.shareholder-deleted)').each(function() {
					if ($(this).data('person_token') === _token) {
						persons.push($(_this));
						return;
					}
				});
			}
		});
		if ($(persons).length > 0) {
			show_persons(persons, 'shareholder');
			var _persons_html = $('p#error-list #persons').html();
			if ($('p#error-list span').is(':empty')) $('p#error-list #persons').html(_persons_html.replace('Also, you', 'You'));
			else $('p#error-list #persons').html(_persons_html.replace('You', 'Also, you'));
		}
		else $('p#error-list #persons').empty();
	});
	
	
	// Before director delete function 
	function before_director_delete() {
		// focus on non-deleted tab
		$('#director-slide div.tab').removeClass('active');
		$('#director-slide div.tab:not(.director-deleted)').last().addClass('active');
		if ($('#director-slide div.tab:not(.director-deleted)').length === 1) {
			$('#director-slide div.tab.active p.delete-director-button').hide();
		}
		// show block
		$('.one-director').hide();
		$('.one-director').each(function() {
			if ($(this).data('person_token') === $('#director-slide div.tab.active').data('person_token')) {
				$(this).show();
				show_errors();
			}
		});
	}


	// Add click listener for delete director button
	$('#director-slide').on('click', 'p.delete-director-button', function() {
		
		if ($(this).parent('div.tab').hasClass('director-deleted')) {
			// changing tabs
			$(this).parents('div.tab').removeClass('director-deleted');
			$(this).text('delete');
			// enabling buttons
			if ($('#director-slide').find('[valid="0"]').length === 0) {
				$('#add-director-button, .bx-next').removeAttr('disabled');
			}
		} else {
			if ($('#director-slide div.tab:not(.director-deleted)').length === 1) {
				return;
			} else {
				if ($(this).parent('div.tab').data('person_token')) {			
					// set tab as deleted
					$(this).parent('div.tab').addClass('director-deleted');
					$(this).text('Cancel');
					before_director_delete();
				} else {
					// Delete block and tab
					var _this = $(this);
					$('.one-director').each(function() {
						if ($(this).data('person_token') === $(_this).parent('div.tab').data('person_token')) {
							if ($(this).find('[valid=1]:visible').length !== 0) {
								// set tab as deleted
								$(_this).parent('div.tab').addClass('director-deleted');
								$(_this).text('Cancel');
							} else {
								$(_this).parent('div.tab').remove();
								$(this).remove();
							}
						}
					});

					before_director_delete();

					// Enable add and next buttons
					$('#add-director-button, .bx-next').removeAttr('disabled');
				}
			}
		}

		if ($('#director-slide div.tab:not(.director-deleted)').length === 1) {
			$('#director-slide div.tab.active .delete-director-button').hide();
		} else {
			$('#director-slide div.tab:not(.director-deleted)').find('.delete-director-button').show();
		}
	});
	
	
	// Add click listener for add director button
	$('#director-slide').on('click', 'button#add-director-button', function() {
		if ($('.one-director:visible').find('[valid="0"]').length !== 0) {
			return false;
		} 
		
		var _this = null;

		$('#director-slide .one-director').each(function() {
			if (!$(this).data('person_token')) _this = $(this);
		});

		if (_this !== null) {
			var _corp = '';
			if ($(_this).find('.director_corporate').hasClass('active')) {
				_corp = '/1';
			}
			$.ajax({
				type: 'POST',
				url: 'http://redwood-formations.com/orders/add_person/director' + _corp,
				dataType: 'json',
				data: $(_this).find('input, textarea').serialize()
			}).done(function(response) {
				var _name = $(_this).find('input.director_name').val();
				var _checked = $(_this).find('.ds-so-same-fields').is(':checked');
				var _tab;
				// Set shareholder id for tab and block
				$(_this).data('person_token', response.person_token);
				$('#director-slide div.tab').each(function() {
					if (!$(this).data('person_token')) { 
						$(this).data('person_token', response.person_token); 
						_tab = $(this);
					}
				});

				// Add new tab
				$('#director-slide div.tab').removeClass('active');
				$('<div class="tab active"><p class="tab-name">New Director</p><p class="person-roles"></p><p class="delete-director-button">delete</p></div>').insertBefore($('button#add-director-button'));
				$('#director-slide p.delete-director-button').show();

				// Disable all inputs and textareas before hide this block			
				$(_this).find('input:not([name="person[date]"], [name="person[shareholder]"], [name="person[owner]"], :checkbox), textarea, select').each(function() {
					if ($(this).parent('td').find('select.date-field').length > 0) {
						$(this).hide().siblings('select.date-field').hide();
						$(this).siblings('div').show();
						$(this).siblings('div').find('span').html($(this).siblings('input:hidden').val());
					} else {
						$(this).hide().siblings().show();
						$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
					}

				});

				// Add new block
				$('.one-director:visible').hide();
				$(_this).hide().clone().appendTo($('#director-slide')).show(); // Old block
				$('.one-director:visible').find('input:not([name="person[date]"], [name="person[shareholder]"], [name="person[owner]"], :checkbox), textarea, select').each(function() { // New block
					if ($(this).parent('td').find('select.date-field').length > 0) {
						$(this).siblings('div').find('span').text('');
						$(this).siblings().hide();
						$(this).val('').attr({value: '', valid: 0}).show();
						$(this).siblings('select').val('').attr({value: '', valid: 0}).show();
					} else {
						$(this).siblings().find('span').text('');
						$(this).siblings().hide();
						$(this).val('').attr({value: '', valid: 0}).show();
					}
				});
				
				// set checkboxs to false and hide the tables
				$('.one-director:visible .ds-same-fields').prop('checked', false);
				$('.one-director:visible .ds-so-same-fields').prop('checked', false);
				$('.one-director:visible .ds-same-table').hide();
				$('.one-director:visible .ds-so-same-table').hide();
				$('.one-director:visible .ds-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
				$('.one-director:visible .ds-so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');

				// set to the natural person
				$('.one-director:visible .director_nature').addClass('active');
				$('.one-director:visible .director_corporate').removeClass('active');
				$('.one-director:visible .ds-same-fields').parent('p').show();
				$('.one-director:visible .ds-so-same-fields').parent('p').show();

				$('.one-director:visible .director_name_label').text('Full Name');
				fields['director_name'] ='Full Name';
				$('.one-director:visible .director_address_label').text('Residential Address');
				fields['director_address'] ='Residential Address';
				$('.one-director:visible .director_registration_no_label').text('Passport No. and Place of Issue');
				fields['director_registration_no'] ='Passport No. and Place of Issue';
				$('.one-director:visible .director_registration_date_label').text('Date of Birth');

				show_errors();
					
				$('.one-shareholder:visible textarea').each(function() {
					$(this).height(48);
				});

				if ($('#director-slide div.tab:not(.director-deleted)').length === 1) {
					$('#director-slide div.tab.active .delete-director-button').hide();
				} else {
					$('#director-slide div.tab:not(.director-deleted)').find('.delete-director-button').show();
				}
				
				if ($(_this).find('.ds-same-fields:checkbox').is(':checked')) {
					// Add Block to the shareholder slide
					var _this_sh = $(_this).clone().appendTo($('#shareholder-slide'));
					
					$(_this_sh).removeClass('one-director').addClass('one-shareholder');
					$(_this_sh).hide();
					$(_this_sh).find('.director-first-row').appendTo($(_this_sh).find('.main-table'));
					$(_this_sh).find('.ds-same-fields:checkbox').parent().remove();
					$(_this_sh).find('.ds-same-table').remove();
					
					$(_this_sh).html($(_this_sh).html().replace(/(director_shareholder)/g, 'shareholder'));
					$(_this_sh).html($(_this_sh).html().replace(/(director)/g, 'shareholder'));
					$(_this_sh).html($(_this_sh).html().replace(/(Director)/g, 'Shareholder'));
					$(_this_sh).html($(_this_sh).html().replace(/(ds\-so\-same)/g, 'so-same'));
					$(_this_sh).data('person_token', response.person_token);
					$(_this_sh).find('.so-same-fields').prop('checked', _checked);
					
					$(_this_sh).find('input').each(function() {
						var _attr_name = $(this).attr('name');
						$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
						$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
					});
					$(_this_sh).find('textarea').each(function() {
						var _attr_name = $(this).attr('name');
						$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
						$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
					});
					$(_this_sh).find('.date-day').val($(_this).find('.date-day').val());
					$(_this_sh).find('.date-month').val($(_this).find('.date-month').val());
					$(_this_sh).find('.date-year').val($(_this).find('.date-year').val());
					
					// Hide the natural/corporate toggle 
					$(_this_sh).find('.shareholder-person-toggle').hide();
					
					// Add tab to the shareholder slide
					var _tab_sh = $(_tab).clone().insertBefore($('button#add-shareholder-button')).data('person_token', response.person_token);
					$(_tab_sh).html($(_tab_sh).html().replace(/(director)/g, 'shareholder'));
					
					$('.delete-shareholder-button').show();
				}
				
				if ($(_this).find('.ds-so-same-fields:checkbox').is(':checked')) {
					// Add Block to the shareholder slide
					var _this_ow = $(_this).clone().appendTo($('#owner-slide'));
					
					$(_this_ow).removeClass('one-director').addClass('one-owner');
					$(_this_ow).hide();
					$(_this_ow).find('.director-second-row').appendTo($(_this_ow).find('.main-table'));
					$(_this_ow).find('.ds-same-fields:checkbox, .ds-so-same-fields:checkbox').parent().remove();
					$(_this_ow).find('.ds-same-table, .ds-so-same-table, .director-person-toggle').remove();
					
					$(_this_ow).html($(_this_ow).html().replace(/(director)/g, 'ultimate_owner'));
					$(_this_ow).html($(_this_ow).html().replace(/(Director)/g, 'Ultimate Beneficial Owner'));
					$(_this_ow).data('person_token', response.person_token);
					
					$(_this_ow).find('input').each(function() {
						var _attr_name = $(this).attr('name');
						$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
						$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
					});
					$(_this_ow).find('textarea').each(function() {
						var _attr_name = $(this).attr('name');
						$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
						$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
					});
					$(_this_ow).find('.date-day').val($(_this).find('.date-day').val());
					$(_this_ow).find('.date-month').val($(_this).find('.date-month').val());
					$(_this_ow).find('.date-year').val($(_this).find('.date-year').val());
					
					// Add tab to the shareholder slide
					var _tab_ow = $(_tab).clone().insertBefore($('button#add-owner-button')).data('person_token', response.person_token);
					$(_tab_ow).html($(_tab_ow).html().replace(/(director)/g, 'owner'));
					
					$('.delete-owner-button').show();
				}
			});
		} else {
			// Add new tab
			$('#director-slide div.tab').removeClass('active');
			$('<div class="tab active"><p class="tab-name">New Director</p><p class="person-roles"></p><p class="delete-director-button">delete</a></div>').insertBefore($('button#add-director-button'));
			$('#director-slide p.delete-director-button').show();

			// Add new block
			$('.one-director:visible').hide().clone().appendTo($('#director-slide')).show(); // Old block
			$('.one-director:visible').find('input:not([name="person[date]"], [name="person[shareholder]"], [name="person[owner]"], :checkbox), textarea, select').each(function() { // New block
				if ($(this).parent('td').find('select.date-field').length > 0) {
					$(this).siblings('div').find('span').text('');
					$(this).siblings().hide();
					$(this).val('').show().attr({value: '', valid: 0}).show();
					$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
				} else {
					$(this).siblings().find('span').text('');
					$(this).siblings().hide();
					$(this).val('').attr({value: '', valid: 0}).show();
				}
			});
			
			// set checkbox false and hide the table
			$('.one-director:visible .ds-same-fields').prop('checked', false);
			$('.one-director:visible .ds-so-same-fields').prop('checked', false);
			$('.one-director:visible .ds-same-table').hide();
			$('.one-director:visible .ds-so-same-table').hide();
			$('.one-director:visible .ds-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
			$('.one-director:visible .ds-so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');

			// set to the natural person
			$('.one-director:visible .director_nature').addClass('active');
			$('.one-director:visible .director_corporate').removeClass('active');
			$('.one-director:visible .ds-same-fields').parent('p').show();
			$('.one-director:visible .ds-so-same-fields').parent('p').show();

			$('.one-director:visible .director_name_label').text('Full Name');
			fields['director_name'] ='Full Name';
			$('.one-director:visible .director_address_label').text('Residential Address');
			fields['director_address'] ='Residential Address';
			$('.one-director:visible .director_registration_no_label').text('Passport No. and Place of Issue');
			fields['director_registration_no'] ='Passport No. and Place of Issue';
			$('.one-director:visible .director_registration_date_label').text('Date of Birth');

			show_errors();
				
			$('.one-director:visible textarea').each(function() {
				$(this).height(48);
			});

			if ($('#director-slide div.tab:not(.director-deleted)').length === 1) {
				$('#director-slide div.tab.active .delete-director-button').hide();
			} else {
				$('#director-slide div.tab:not(.director-deleted)').find('.delete-director-button').show();
			}
			
			
		}


		// Disable add button and next button
		$('#add-director-button, .bx-next').attr('disabled', 'disabled');
		return false;
	});
	
	
	// Add click listener for director tabs
	$('#director-slide').on('click', 'div.tab:not(.director-deleted) p.tab-name, div.tab:not(.director-deleted) p.person-roles', function() {
		var _self = $(this).parents('div.tab');
		$('#director-slide div.tab').removeClass('active');
		$(this).parents('div.tab').addClass('active');
		$('.one-director:visible').hide();
		$('.one-director').each(function() {
			if ($(this).data('person_token') === _self.data('person_token')) {
				$(this).show();
				show_errors();
				return;
			}
		});
		var persons = [];
		$('.one-director:not(:visible)').each(function() {
			if ($(this).find('[valid="0"]').length !== 0) {
				var _token = $(this).data('person_token'), _this = $(this);
				$('#director-tabs div.tab:not(.director-deleted)').each(function() {
					if ($(this).data('person_token') === _token) {
						persons.push($(_this));
						return;
					}
				});
			}
		});
		if ($(persons).length > 0) {
			show_persons(persons, 'director');
			var _persons_html = $('p#error-list #persons').html();
			if ($('p#error-list span').is(':empty')) $('p#error-list #persons').html(_persons_html.replace('Also, you', 'You'));
			else $('p#error-list #persons').html(_persons_html.replace('You', 'Also, you'));
		}
		else $('p#error-list #persons').empty();
	});
	
	
	// Add click listener for next button
	$('div.outside').on('click', '#slider-next', function() {
		// if-block for the owner slide
		if (slider.getCurrentSlideElement().attr('id') === 'owner-slide') {
			//delete posted owners
			$('#owner-slide div.tab.owner-deleted').each(function() {
				if ($(this).data('person_token')) {
					var _this_id = $(this).data('person_token');
					
					if ($(this).find('p.person-roles').is(':empty')) {
						$.ajax({
							type: 'POST',
							url: 'http://redwood-formations.com/orders/delete_person/' + _this_id
						});
					} else {
						var _data = {};
						_data['person[owner]'] = 0;
						_data['person[shares_held]'] = '';
						_data['person[source]'] = '';
						
						$.ajax({
							type: 'POST',
							url: 'http://redwood-formations.com/orders/update_person/' + _this_id,
							dataType: 'json',
							data: _data
						});
						
						// Обновить табы у директора и владельца
						$('#director-tabs div.tab, #shareholder-tabs div.tab').each(function() {
							if ($(this).data('person_token') === _this_id) {
								if ($(this).find('p.person-roles').text().split(',').length === 3) {
									$(this).find('p.person-roles').html('&nbsp;(Director, Shareholder)');
								} else {
									$(this).find('p.person-roles').html('');
								}
							}
						});
						
						// Обновить чекбокс у директора
						$('.one-director').each(function() {
							if ($(this).data('person_token') === _this_id) {
								$(this).find('.ds-so-same-fields').prop('checked', false);
								$(this).find('.ds-so-same-table').hide();
								$(this).find('.ds-so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
								return;
							}
						});
						
						// Обновить чекбокс у акционера
						$('.one-shareholder').each(function() {
							if ($(this).data('person_token') === _this_id) {
								$(this).find('.so-same-fields').prop('checked', false);
								$(this).find('.so-same-table').hide();
								$(this).find('.so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
								return;
							}
						});
					}
					
					$(this).remove();
					$('.one-owner').each(function() {
						if (_this_id === $(this).data('person_token')) {
							$(this).remove();
						}
					});	
					
				} else {
					$(this).remove();
					$('.one-owner').each(function() {
						if (!$(this).data('person_token')) $(this).remove();
					});
				}
				
			});
			
			// post last owner
			$('#owner-slide .one-owner').each(function() {
				if (!$(this).data('person_token')) {
					var _this = $(this);
					$.ajax({
						type: 'POST',
						url: 'http://redwood-formations.com/orders/add_person/owner',
						dataType: 'json',
						data: $(this).find('input, textarea').serialize(),
						success: function(response) {
							// Set owner id to tab and block
							$(_this).data('person_token', response.person_token);
							$('#owner-tabs div.tab').each(function() {
								if (!$(this).data('person_token')) {
									$(this).data('person_token', response.person_token);
								}
							});


							// Disable all inputs and textareas before hide this block			
							$(_this).find('input:not([name="person[date]"], :checkbox), textarea, select').each(function() {
								if ($(this).parent('td').find('select.date-field').length > 0) {
									$(this).hide().siblings('select.date-field').hide();
									$(this).siblings('div').show();
									$(this).siblings('div').find('span').html($(this).siblings('input:hidden').val());
								} else {
									$(this).hide().siblings().show();
									$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
								}

							});
						}
					});
				}
			});
			
			// get all natural persons
			$.ajax({
				type: 'POST',
				url: 'http://redwood-formations.com/orders/get_persons',
				dataType: 'json',
				success: function(response) {
					$('#posted_persons').empty();
					
					
					
					$(response['persons']).each(function() {
						var _roles = [];
						
						if (this.director === '1') _roles.push('Director');
						if (this.shareholder === '1') _roles.push('Shareholder');
						if (this.owner === '1') _roles.push('Ultimate Beneficial Owner');
						
						var roles = ' (' + _roles.join(', ') + ')';
						
						$('#posted_persons').append('<input type="checkbox" '
								+ 'class="posted_persons_ch">'
								+ '<label>' + this.name + roles + '</label><br>');
						
						$('#posted_persons input:checkbox:last').data('person_token', this.secure_token);
					});
				}
			});
			
		} else if (slider.getCurrentSlideElement().attr('id') === 'shareholder-slide') {
		// if-block for the shareholder slide
			//delete posted shareholders
			$('#shareholder-slide div.tab.shareholder-deleted').each(function() {
				var _this_id = $(this).data('person_token');
				
				if (_this_id) {
					var _check = true;
					
					$('.one-director').each(function() {
						if ($(this).data('person_token') === _this_id) {
							_check = false;
							return;
						}
					});
					
					// Удаление блока акционера
					$(this).remove();
					$('.one-shareholder').each(function() {
						if (_this_id === $(this).data('person_token')) {
							$(this).remove();
						}
					});
					
					if (_check) {
						// Отправить ПОСТ-запрос удаления
						$.ajax({
							type: 'POST',
							url: 'http://redwood-formations.com/orders/delete_person/' + _this_id
						});

						// Remove block from the Owner slide
						if ($('#owner-tabs div.tab').length > 1) {
							$('#owner-tabs div.tab, .one-owner').each(function() {
								if ($(this).data('person_token') === _this_id) {
									$(this).remove();
									return;
								}
							});

							if (!$('#owner-tabs div.tab.active').length) {
								$('#owner-tabs div.tab').first().addClass('active');
								$('.one-owner').each(function() {
									if ($(this).data('person_token') === $('#owner-tabs div.tab.active').data('person_token')) {
										$(this).show();
										return;
									}
								});
							}
						} else {
							// Reset tab
							$('#owner-slide div.tab').removeData('person_token');
							$('#owner-slide div.tab').addClass('active');
							$('#owner-slide div.tab p.tab-name').html('New Ultimate Beneficial Owner');
							$('#owner-slide div.tab p.person-roles').html('');

							// Reset block
							$('.one-owner').removeData('person_token');
							$('.one-owner').find('input:not([name="person[date]"]), textarea, select').each(function() { // New block
								if ($(this).parent('td').find('select.date-field').length > 0) {
									$(this).siblings('div').find('span').text('');
									$(this).siblings().hide();
									$(this).val('').show().attr({value: '', valid: 0}).show();
									$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
								} else {
									$(this).siblings().find('span').text('');
									$(this).siblings().hide();
									$(this).val('').attr({value: '', valid: 0}).show();
								}
								show_errors();
							});
							$('.one-owner textarea').each(function() {
								$(this).height(48);
							});

							$('#owner-slide div.tab.active .delete-owner-button').hide();
						}
					} else {
						// Отправить ПОСТ-запрос обновления
						var _data = {};
						
						_data['person[shareholder]'] = 0;
						_data['person[shares_issued]'] = '';
						
						$.ajax({
							type: 'POST',
							url: 'http://redwood-formations.com/orders/update_person/' + _this_id,
							dataType: 'json',
							data: _data
						});
						
						// Обновить табы у директора и владельца
						$('#director-tabs div.tab, #owner-tabs div.tab').each(function() {
							if ($(this).data('person_token') === _this_id) {
								if ($(this).find('p.person-roles').text().split(',').length === 3) {
									$(this).find('p.person-roles').html('&nbsp;(Director, Ultimate Beneficial Owner)');
								} else {
									$(this).find('p.person-roles').html('');
								}
							}
						});
						
						// Обновить чекбокс у директора
						$('.one-director').each(function() {
							if ($(this).data('person_token') === _this_id) {
								$(this).find('.ds-same-fields').prop('checked', false);
								$(this).find('.ds-same-table').hide();
								$(this).find('.ds-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
								return;
							}
						});
					}
					
					
					
					
				} else {
					$(this).remove();
					$('.one-shareholder').each(function() {
						if (!$(this).data('person_token')) $(this).remove();
					});
				}
				
			});
			
			// post last shareholder
			$('#shareholder-slide .one-shareholder').each(function() {
				if (!$(this).data('person_token')) {
					var _this = $(this);
					var _corp = '';
					if ($(_this).find('.shareholder_corporate').hasClass('active')) {
						_corp = '/1';
					}
					$.ajax({
						type: 'POST',
						url: 'http://redwood-formations.com/orders/add_person/shareholder' + _corp,
						dataType: 'json',
						data: $(this).find('input, textarea').serialize(),
						success: function(response) {
							var _name = $(_this).find('input.shareholder_name').val();
							var _tab;
							// Set shareholder id to tab and block
							$(_this).data('person_token', response.person_token);
							$('#shareholder-tabs div.tab').each(function() {
								if (!$(this).data('person_token')) {
									$(this).data('person_token', response.person_token);
									_tab = $(this);
								}
							});


							// Disable all inputs and textareas before hide this block			
							$(_this).find('input:not([name="person[date]"], [name="person[owner]"], :checkbox), textarea, select').each(function() {
								if ($(this).parent('td').find('select.date-field').length > 0) {
									$(this).hide().siblings('select.date-field').hide();
									$(this).siblings('div').show();
									$(this).siblings('div').find('span').html($(this).siblings('input:hidden').val());
								} else {
									$(this).hide().siblings().show();
									$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
								}

							});
							
							if ($(_this).find('.so-same-fields:checkbox').is(':checked')) {
								// Add Block to the shareholder slide
								var _this_ow = $(_this).clone().appendTo($('#owner-slide'));

								$(_this_ow).removeClass('one-shareholder').addClass('one-owner');
								$(_this_ow).hide();
								$(_this_ow).find('.shareholder-second-row').appendTo($(_this_ow).find('.main-table'));
								$(_this_ow).find('.so-same-fields:checkbox').parent().remove();
								$(_this_ow).find('.so-same-table, .shareholder-first-row, .shareholder-person-toggle').remove();

								$(_this_ow).html($(_this_ow).html().replace(/(shareholder)/g, 'ultimate_owner'));
								$(_this_ow).html($(_this_ow).html().replace(/(Shareholder)/g, 'Ultimate Beneficial Owner'));
								$(_this_ow).data('person_token', response.person_token);

								$(_this_ow).find('input').each(function() {
									var _attr_name = $(this).attr('name');
									$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
								});
								$(_this_ow).find('textarea').each(function() {
									var _attr_name = $(this).attr('name');
									$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
								});
								$(_this_ow).find('.date-day').val($(_this).find('.date-day').val());
								$(_this_ow).find('.date-month').val($(_this).find('.date-month').val());
								$(_this_ow).find('.date-year').val($(_this).find('.date-year').val());

								// Add tab to the shareholder slide
								var _tab_ow = $(_tab).clone().insertBefore($('button#add-owner-button')).data('person_token', response.person_token);
								$(_tab_ow).html($(_tab_ow).html().replace(/(shareholder)/g, 'owner'));
								$(_tab_ow).removeClass('active');
								
								$('.delete-owner-button').show();
							}
						}
					});
				}
			});
		} else if (slider.getCurrentSlideElement().attr('id') === 'director-slide') {
		// if-block for the director slide
			//delete posted director
			$('#director-slide div.tab.director-deleted').each(function() {
				if ($(this).data('person_token')) {
					$.ajax({
						type: 'POST',
						url: 'http://redwood-formations.com/orders/delete_person/' + $(this).data('person_token')
					});
					var _this_id = $(this).data('person_token');
					
					$(this).remove();
					$('.one-director').each(function() {
						if (_this_id === $(this).data('person_token')) {
							$(this).remove();
						}
					});
					
					// Remove block from the shareholder slide
					if ($('#shareholder-tabs div.tab').length > 1) {
						$('#shareholder-tabs div.tab, .one-shareholder').each(function() {
							if ($(this).data('person_token') === _this_id) {
								$(this).remove();
								return;
							}
						});

						if (!$('#shareholder-tabs div.tab.active').length) {
							$('#shareholder-tabs div.tab').first().addClass('active');
							$('.one-shareholder').each(function() {
								if ($(this).data('person_token') === $('#shareholder-tabs div.tab.active').data('person_token')) {
									$(this).show();
									return;
								}
							});
						}
					} else {
						// Reset tab
						$('#shareholder-slide div.tab').removeData('person_token');
						$('#shareholder-slide div.tab').addClass('active');
						$('#shareholder-slide div.tab p.tab-name').html('New Shareholder');
						$('#shareholder-slide div.tab p.person-roles').html('');

						// Reset block
						$('.one-shareholder').removeData('person_token');
						$('.one-shareholder').find('.shareholder-person-toggle').show();
						$('.one-shareholder').find('input:not([name="person[date]"], [name="person[owner]"], :checkbox), textarea, select').each(function() { // New block
							if ($(this).parent('td').find('select.date-field').length > 0) {
								$(this).siblings('div').find('span').text('');
								$(this).siblings().hide();
								$(this).val('').show().attr({value: '', valid: 0}).show();
								$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
							} else {
								$(this).siblings().find('span').text('');
								$(this).siblings().hide();
								$(this).val('').attr({value: '', valid: 0}).show();
							}
						});

						// set checkbox false and hide the table
						$('.one-shareholder .so-same-fields').prop('checked', false);
						$('.one-shareholder .so-same-table').hide();
						$('.one-shareholder .so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');

						// set to the natural person
						$('.one-shareholder .shareholder_nature').addClass('active');
						$('.one-shareholder .shareholder_corporate').removeClass('active');
						$('.one-shareholder .so-same-fields').parent('p').show();

						$('.one-shareholder:visible .shareholder_name_label').text('Full Name');
						fields['shareholder_name'] ='Full Name';
						$('.one-shareholder:visible .shareholder_address_label').text('Residential Address');
						fields['shareholder_address'] ='Residential Address';
						$('.one-shareholder:visible .shareholder_registration_no_label').text('Passport No. and Place of Issue');
						fields['shareholder_registration_no'] ='Passport No. and Place of Issue';
						$('.one-shareholder:visible .shareholder_registration_date_label').text('Date of Birth');

						show_errors();

						$('.one-shareholder textarea').each(function() {
							$(this).height(48);
						});

						$('#shareholder-slide div.tab.active .delete-shareholder-button').hide();
					}
					
					// Remove block from the Owner slide
					if ($('#owner-tabs div.tab').length > 1) {
						$('#owner-tabs div.tab, .one-owner').each(function() {
							if ($(this).data('person_token') === _this_id) {
								$(this).remove();
								return;
							}
						});

						if (!$('#owner-tabs div.tab.active').length) {
							$('#owner-tabs div.tab').first().addClass('active');
							$('.one-owner').each(function() {
								if ($(this).data('person_token') === $('#owner-tabs div.tab.active').data('person_token')) {
									$(this).show();
									return;
								}
							});
						}
					} else {
						// Reset tab
						$('#owner-slide div.tab').removeData('person_token');
						$('#owner-slide div.tab').addClass('active');
						$('#owner-slide div.tab p.tab-name').html('New Ultimate Beneficial Owner');
						$('#owner-slide div.tab p.person-roles').html('');

						// Reset block
						$('.one-owner').removeData('person_token');
						$('.one-owner').find('input:not([name="person[date]"]), textarea, select').each(function() { // New block
							if ($(this).parent('td').find('select.date-field').length > 0) {
								$(this).siblings('div').find('span').text('');
								$(this).siblings().hide();
								$(this).val('').show().attr({value: '', valid: 0}).show();
								$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
							} else {
								$(this).siblings().find('span').text('');
								$(this).siblings().hide();
								$(this).val('').attr({value: '', valid: 0}).show();
							}
							show_errors();
						});
						$('.one-owner textarea').each(function() {
							$(this).height(48);
						});

						$('#owner-slide div.tab.active .delete-owner-button').hide();
					}
				} else {
					$(this).remove();
					$('.one-director').each(function() {
						if (!$(this).data('person_token')) $(this).remove();
					});
				}
				
			});
			
			// post last director
			$('#director-slide .one-director').each(function() {
				if (!$(this).data('person_token')) {
					var _this = $(this);
					var _corp = '';
					if ($(_this).find('.director_corporate').hasClass('active')) {
						_corp = '/1';
					}
					$.ajax({
						type: 'POST',
						url: 'http://redwood-formations.com/orders/add_person/director' + _corp,
						dataType: 'json',
						data: $(this).find('input, textarea').serialize(),
						success: function(response) {
							var _name = $(_this).find('input.director_name').val();
							var _checked = $(_this).find('.ds-so-same-fields').is(':checked');
							var _tab;
							// Set director id to tab and block
							$(_this).data('person_token', response.person_token);
							$('#director-tabs div.tab').each(function() {
								if (!$(this).data('person_token')) {
									$(this).data('person_token', response.person_token);
									_tab = $(this);
								}
							});


							// Disable all inputs and textareas before hide this block			
							$(_this).find('input:not([name="person[date]"], [name="person[owner]"], [name="person[shareholder]"], :checkbox), textarea, select').each(function() {
								if ($(this).parent('td').find('select.date-field').length > 0) {
									$(this).hide().siblings('select.date-field').hide();
									$(this).siblings('div').show();
									$(this).siblings('div').find('span').html($(this).siblings('input:hidden').val());
								} else {
									$(this).hide().siblings().show();
									$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
								}

							});
							
							if ($(_this).find('.ds-same-fields:checkbox').is(':checked')) {
								// Add Block to the shareholder slide
								var _this_sh = $(_this).clone().appendTo($('#shareholder-slide'));

								$(_this_sh).removeClass('one-director').addClass('one-shareholder');
								$(_this_sh).hide();
								$(_this_sh).find('.director-first-row').appendTo($(_this_sh).find('.main-table'));
								$(_this_sh).find('.ds-same-fields:checkbox').parent().remove();
								$(_this_sh).find('.ds-same-table').remove();

								$(_this_sh).html($(_this_sh).html().replace(/(director_shareholder)/g, 'shareholder'));
								$(_this_sh).html($(_this_sh).html().replace(/(director)/g, 'shareholder'));
								$(_this_sh).html($(_this_sh).html().replace(/(Director)/g, 'Shareholder'));
								$(_this_sh).html($(_this_sh).html().replace(/(ds\-so\-same)/g, 'so-same'));
								$(_this_sh).data('person_token', response.person_token);
								$(_this_sh).find('.so-same-fields').prop('checked', _checked);

								$(_this_sh).find('input').each(function() {
									var _attr_name = $(this).attr('name');
									$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
								});
								$(_this_sh).find('textarea').each(function() {
									var _attr_name = $(this).attr('name');
									$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
								});
								$(_this_sh).find('.date-day').val($(_this).find('.date-day').val());
								$(_this_sh).find('.date-month').val($(_this).find('.date-month').val());
								$(_this_sh).find('.date-year').val($(_this).find('.date-year').val());
								
								// Hide the natural/corporate toggle 
								$(_this_sh).find('.shareholder-person-toggle').hide();

								// Add tab to the shareholder slide
								var _tab_sh = $(_tab).clone().insertBefore($('button#add-shareholder-button')).data('person_token', response.person_token);
								$(_tab_sh).html($(_tab_sh).html().replace(/(director)/g, 'shareholder'));
								$(_tab_sh).removeClass('active');
								
								$('.delete-shareholder-button').show();
							}

							if ($(_this).find('.ds-so-same-fields:checkbox').is(':checked')) {
								// Add Block to the shareholder slide
								var _this_ow = $(_this).clone().appendTo($('#owner-slide'));

								$(_this_ow).removeClass('one-director').addClass('one-owner');
								$(_this_ow).hide();
								$(_this_ow).find('.director-second-row').appendTo($(_this_ow).find('.main-table'));
								$(_this_ow).find('.ds-same-fields:checkbox, .ds-so-same-fields:checkbox').parent().remove();
								$(_this_ow).find('.ds-same-table, .ds-so-same-table, .director-person-toggle').remove();

								$(_this_ow).html($(_this_ow).html().replace(/(director)/g, 'ultimate_owner'));
								$(_this_ow).html($(_this_ow).html().replace(/(Director)/g, 'Ultimate Beneficial Owner'));
								$(_this_ow).data('person_token', response.person_token);

								$(_this_ow).find('input').each(function() {
									var _attr_name = $(this).attr('name');
									$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
								});
								$(_this_ow).find('textarea').each(function() {
									var _attr_name = $(this).attr('name');
									$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
								});
								$(_this_ow).find('.date-day').val($(_this).find('.date-day').val());
								$(_this_ow).find('.date-month').val($(_this).find('.date-month').val());
								$(_this_ow).find('.date-year').val($(_this).find('.date-year').val());

								// Add tab to the shareholder slide
								var _tab_ow = $(_tab).clone().insertBefore($('button#add-owner-button')).data('person_token', response.person_token);
								$(_tab_ow).html($(_tab_ow).html().replace(/(director)/g, 'owner'));
								$(_tab_ow).removeClass('active');
								
								$('.delete-owner-button').show();
							}
						}
					});
				}
			});
		}

		// disallow tab using for all not visible elements
		slider.getCurrentSlideElement().find('input, textarea, select, a').attr('tabindex', '-1');
		
		// go to next slide
		slider.getCurrentSlideElement().nextAll('.slide').first().height('100%');
		slider.goToNextSlide();
		slider.getCurrentSlideElement().prevAll('.slide').first().height(1);
		
		// allow tab using for visible elements
		slider.getCurrentSlideElement().find('input, textarea, select, a').removeAttr('tabindex');
		
		// show steps
		slider.getCurrentSlideElement().find('.step').text('step ' + (slider.getCurrentSlide()+1) + ' / ' + slider.getSlideCount());
		
		// check if the all inputs are valid and show errors
		valid();
		show_errors();
		if (slider.getCurrentSlideElement().attr('id') === 'owner-slide') {
			var persons = [];
			$('.one-owner:not(:visible)').each(function() {
				if ($(this).find('[valid="0"]').length !== 0) {
					var _token = $(this).data('person_token'), _this = $(this);
					$('#owner-tabs div.tab:not(.owner-deleted)').each(function() {
						if ($(this).data('person_token') === _token) {
							persons.push($(_this));
							return;
						}
					});
				}
			});
			if ($(persons).length > 0)	show_persons(persons, 'owner');
		} else if (slider.getCurrentSlideElement().attr('id') === 'shareholder-slide') {
			var persons = [];
			$('.one-shareholder:not(:visible)').each(function() {
				if ($(this).find('[valid="0"]').length !== 0) {
					var _token = $(this).data('person_token'), _this = $(this);
					$('#shareholder-tabs div.tab:not(.shareholder-deleted)').each(function() {
						if ($(this).data('person_token') === _token) {
							persons.push($(_this));
							return;
						}
					});
				}
			});
			if ($(persons).length > 0)	show_persons(persons, 'shareholder');
		} else if (slider.getCurrentSlideElement().attr('id') === 'director-slide') {
			var persons = [];
			$('.one-director:not(:visible)').each(function() {
				if ($(this).find('[valid="0"]').length !== 0) {
					var _token = $(this).data('person_token'), _this = $(this);
					$('#director-tabs div.tab:not(.director-deleted)').each(function() {
						if ($(this).data('person_token') === _token) {
							persons.push($(_this));
							return;
						}
					});
				}
			});
			if ($(persons).length > 0)	show_persons(persons, 'director');
		}
		
		// replace the next button with the submit for the last slide
		if (slider.getCurrentSlide() === slider.getSlideCount()-1) {
			$('.bx-next').text('Finish').removeAttr('disabled');
		}
		
		return false;
	});


	// add click listener for the prev button
	$('div.outside').on('click', '#slider-prev', function() {
		if (slider.getCurrentSlideElement().attr('id') === 'owner-slide') {
			//delete posted owners
			$('#owner-slide div.tab.owner-deleted').each(function() {
				if ($(this).data('person_token')) {
					var _this_id = $(this).data('person_token');
					
					if ($(this).find('p.person-roles').is(':empty')) {
						$.ajax({
							type: 'POST',
							url: 'http://redwood-formations.com/orders/delete_person/' + _this_id
						});
					} else {
						var _data = {};
						_data['person[owner]'] = 0;
						_data['person[shares_held]'] = '';
						_data['person[source]'] = '';
						
						$.ajax({
							type: 'POST',
							url: 'http://redwood-formations.com/orders/update_person/' + _this_id,
							dataType: 'json',
							data: _data
						});
						
						// Обновить табы у директора и владельца
						$('#director-tabs div.tab, #shareholder-tabs div.tab').each(function() {
							if ($(this).data('person_token') === _this_id) {
								if ($(this).find('p.person-roles').text().split(',').length === 3) {
									$(this).find('p.person-roles').html('&nbsp;(Director, Shareholder)');
								} else {
									$(this).find('p.person-roles').html('');
								}
							}
						});
						
						// Обновить чекбокс у директора
						$('.one-director').each(function() {
							if ($(this).data('person_token') === _this_id) {
								$(this).find('.ds-so-same-fields').prop('checked', false);
								$(this).find('.ds-so-same-table').hide();
								$(this).find('.ds-so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
								return;
							}
						});
						
						// Обновить чекбокс у акционера
						$('.one-shareholder').each(function() {
							if ($(this).data('person_token') === _this_id) {
								$(this).find('.so-same-fields').prop('checked', false);
								$(this).find('.so-same-table').hide();
								$(this).find('.so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
								return;
							}
						});
					}
					
					$(this).remove();
					$('.one-owner').each(function() {
						if (_this_id === $(this).data('person_token')) {
							$(this).remove();
						}
					});	
					
				} else {
					$(this).remove();
					$('.one-owner').each(function() {
						if (!$(this).data('person_token')) $(this).remove();
					});
				}
				
			});
			
			// post last owner
//			$('#owner-slide .one-owner').each(function() {
//				if (!$(this).data('person_token')) {
//					var _this = $(this);
//					$.ajax({
//						type: 'POST',
//						url: 'http://redwood-formations.com/orders/add_person/owner',
//						dataType: 'json',
//						data: $(this).find('input, textarea').serialize(),
//						success: function(response) {
//							// Set owner id to tab and block
//							$(_this).data('person_token', response.person_token);
//							$('#owner-tabs div.tab').each(function() {
//								if (!$(this).data('person_token')) {
//									$(this).data('person_token', response.person_token);
//								}
//							});
//
//
//							// Disable all inputs and textareas before hide this block			
//							$(_this).find('input:not([name="person[date]"], :checkbox), textarea, select').each(function() {
//								if ($(this).parent('td').find('select.date-field').length > 0) {
//									$(this).hide().siblings('select.date-field').hide();
//									$(this).siblings('div').show();
//									$(this).siblings('div').find('span').html($(this).siblings('input:hidden').val());
//								} else {
//									$(this).hide().siblings().show();
//									$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
//								}
//
//							});
//						}
//					});
//				}
//			});
		} else if (slider.getCurrentSlideElement().attr('id') === 'shareholder-slide') {
		// if-block for the shareholder slide
			//delete posted shareholders
			$('#shareholder-slide div.tab.shareholder-deleted').each(function() {
				var _this_id = $(this).data('person_token');
				
				if (_this_id) {
					var _check = true;
					
					$('.one-director').each(function() {
						if ($(this).data('person_token') === _this_id) {
							_check = false;
							return;
						}
					});
					
					// Удаление блока акционера
					$(this).remove();
					$('.one-shareholder').each(function() {
						if (_this_id === $(this).data('person_token')) {
							$(this).remove();
						}
					});
					
					if (_check) {
						// Отправить ПОСТ-запрос удаления
						$.ajax({
							type: 'POST',
							url: 'http://redwood-formations.com/orders/delete_person/' + _this_id
						});

						// Remove block from the Owner slide
						if ($('#owner-tabs div.tab').length > 1) {
							$('#owner-tabs div.tab, .one-owner').each(function() {
								if ($(this).data('person_token') === _this_id) {
									$(this).remove();
									return;
								}
							});

							if (!$('#owner-tabs div.tab.active').length) {
								$('#owner-tabs div.tab').first().addClass('active');
								$('.one-owner').each(function() {
									if ($(this).data('person_token') === $('#owner-tabs div.tab.active').data('person_token')) {
										$(this).show();
										return;
									}
								});
							}
						} else {
							// Reset tab
							$('#owner-slide div.tab').removeData('person_token');
							$('#owner-slide div.tab').addClass('active');
							$('#owner-slide div.tab p.tab-name').html('New Ultimate Beneficial Owner');
							$('#owner-slide div.tab p.person-roles').html('');

							// Reset block
							$('.one-owner').removeData('person_token');
							$('.one-owner').find('input:not([name="person[date]"]), textarea, select').each(function() { // New block
								if ($(this).parent('td').find('select.date-field').length > 0) {
									$(this).siblings('div').find('span').text('');
									$(this).siblings().hide();
									$(this).val('').show().attr({value: '', valid: 0}).show();
									$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
								} else {
									$(this).siblings().find('span').text('');
									$(this).siblings().hide();
									$(this).val('').attr({value: '', valid: 0}).show();
								}
								show_errors();
							});
							$('.one-owner textarea').each(function() {
								$(this).height(48);
							});

							$('#owner-slide div.tab.active .delete-owner-button').hide();
						}
					} else {
						// Отправить ПОСТ-запрос обновления
						var _data = {};
						
						_data['person[shareholder]'] = 0;
						_data['person[shares_issued]'] = '';
						
						$.ajax({
							type: 'POST',
							url: 'http://redwood-formations.com/orders/update_person/' + _this_id,
							dataType: 'json',
							data: _data
						});
						
						// Обновить табы у директора и владельца
						$('#director-tabs div.tab, #owner-tabs div.tab').each(function() {
							if ($(this).data('person_token') === _this_id) {
								if ($(this).find('p.person-roles').text().split(',').length === 3) {
									$(this).find('p.person-roles').html('&nbsp;(Director, Ultimate Beneficial Owner)');
								} else {
									$(this).find('p.person-roles').html('');
								}
							}
						});
						
						// Обновить чекбокс у директора
						$('.one-director').each(function() {
							if ($(this).data('person_token') === _this_id) {
								$(this).find('.ds-same-fields').prop('checked', false);
								$(this).find('.ds-same-table').hide();
								$(this).find('.ds-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');
								return;
							}
						});
					}
					
					
					
					
				} else {
					$(this).remove();
					$('.one-shareholder').each(function() {
						if (!$(this).data('person_token')) $(this).remove();
					});
				}
				
			});
			
			// post last shareholder
//			$('#shareholder-slide .one-shareholder').each(function() {
//				if (!$(this).data('person_token')) {
//					var _this = $(this);
//					var _corp = '';
//					if ($(_this).find('.shareholder_corporate').hasClass('active')) {
//						_corp = '/1';
//					}
//					$.ajax({
//						type: 'POST',
//						url: 'http://redwood-formations.com/orders/add_person/shareholder' + _corp,
//						dataType: 'json',
//						data: $(this).find('input, textarea').serialize(),
//						success: function(response) {
//							var _name = $(_this).find('input.shareholder_name').val();
//							var _tab;
//							// Set shareholder id to tab and block
//							$(_this).data('person_token', response.person_token);
//							$('#shareholder-tabs div.tab').each(function() {
//								if (!$(this).data('person_token')) {
//									$(this).data('person_token', response.person_token);
//									_tab = $(this);
//								}
//							});
//
//
//							// Disable all inputs and textareas before hide this block			
//							$(_this).find('input:not([name="person[date]"], [name="person[owner]"], :checkbox), textarea, select').each(function() {
//								if ($(this).parent('td').find('select.date-field').length > 0) {
//									$(this).hide().siblings('select.date-field').hide();
//									$(this).siblings('div').show();
//									$(this).siblings('div').find('span').html($(this).siblings('input:hidden').val());
//								} else {
//									$(this).hide().siblings().show();
//									$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
//								}
//
//							});
//							
//							if ($(_this).find('.so-same-fields:checkbox').is(':checked')) {
//								// Add Block to the shareholder slide
//								var _this_ow = $(_this).clone().appendTo($('#owner-slide'));
//
//								$(_this_ow).removeClass('one-shareholder').addClass('one-owner');
//								$(_this_ow).hide();
//								$(_this_ow).find('.shareholder-second-row').appendTo($(_this_ow).find('.main-table'));
//								$(_this_ow).find('.so-same-fields:checkbox').parent().remove();
//								$(_this_ow).find('.so-same-table, .shareholder-first-row, .shareholder-person-toggle').remove();
//
//								$(_this_ow).html($(_this_ow).html().replace(/(shareholder)/g, 'ultimate_owner'));
//								$(_this_ow).html($(_this_ow).html().replace(/(Shareholder)/g, 'Ultimate Beneficial Owner'));
//								$(_this_ow).data('person_token', response.person_token);
//
//								$(_this_ow).find('input').each(function() {
//									var _attr_name = $(this).attr('name');
//									$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
//									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
//								});
//								$(_this_ow).find('textarea').each(function() {
//									var _attr_name = $(this).attr('name');
//									$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
//									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
//								});
//								$(_this_ow).find('.date-day').val($(_this).find('.date-day').val());
//								$(_this_ow).find('.date-month').val($(_this).find('.date-month').val());
//								$(_this_ow).find('.date-year').val($(_this).find('.date-year').val());
//
//								// Add tab to the shareholder slide
//								var _tab_ow = $(_tab).clone().insertBefore($('button#add-owner-button')).data('person_token', response.person_token);
//								$(_tab_ow).html($(_tab_ow).html().replace(/(shareholder)/g, 'owner'));
//								$(_tab_ow).removeClass('active');
//								
//								$('.delete-owner-button').show();
//							}
//						}
//					});
//				}
//			});
		} else if (slider.getCurrentSlideElement().attr('id') === 'director-slide') {
		// if-block for the director slide
			//delete posted director
			$('#director-slide div.tab.director-deleted').each(function() {
				if ($(this).data('person_token')) {
					$.ajax({
						type: 'POST',
						url: 'http://redwood-formations.com/orders/delete_person/' + $(this).data('person_token')
					});
					var _this_id = $(this).data('person_token');
					
					$(this).remove();
					$('.one-director').each(function() {
						if (_this_id === $(this).data('person_token')) {
							$(this).remove();
						}
					});
					
					// Remove block from the shareholder slide
					if ($('#shareholder-tabs div.tab').length > 1) {
						$('#shareholder-tabs div.tab, .one-shareholder').each(function() {
							if ($(this).data('person_token') === _this_id) {
								$(this).remove();
								return;
							}
						});

						if (!$('#shareholder-tabs div.tab.active').length) {
							$('#shareholder-tabs div.tab').first().addClass('active');
							$('.one-shareholder').each(function() {
								if ($(this).data('person_token') === $('#shareholder-tabs div.tab.active').data('person_token')) {
									$(this).show();
									return;
								}
							});
						}
					} else {
						// Reset tab
						$('#shareholder-slide div.tab').removeData('person_token');
						$('#shareholder-slide div.tab').addClass('active');
						$('#shareholder-slide div.tab p.tab-name').html('New Shareholder');
						$('#shareholder-slide div.tab p.person-roles').html('');

						// Reset block
						$('.one-shareholder').removeData('person_token');
						$('.one-shareholder').find('.shareholder-person-toggle').show();
						$('.one-shareholder').find('input:not([name="person[date]"], [name="person[owner]"], :checkbox), textarea, select').each(function() { // New block
							if ($(this).parent('td').find('select.date-field').length > 0) {
								$(this).siblings('div').find('span').text('');
								$(this).siblings().hide();
								$(this).val('').show().attr({value: '', valid: 0}).show();
								$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
							} else {
								$(this).siblings().find('span').text('');
								$(this).siblings().hide();
								$(this).val('').attr({value: '', valid: 0}).show();
							}
						});

						// set checkbox false and hide the table
						$('.one-shareholder .so-same-fields').prop('checked', false);
						$('.one-shareholder .so-same-table').hide();
						$('.one-shareholder .so-same-table').find('input, textarea').attr('valid', '1').val('').addClass('not-required');

						// set to the natural person
						$('.one-shareholder .shareholder_nature').addClass('active');
						$('.one-shareholder .shareholder_corporate').removeClass('active');
						$('.one-shareholder .so-same-fields').parent('p').show();

						$('.one-shareholder:visible .shareholder_name_label').text('Full Name');
						fields['shareholder_name'] ='Full Name';
						$('.one-shareholder:visible .shareholder_address_label').text('Residential Address');
						fields['shareholder_address'] ='Residential Address';
						$('.one-shareholder:visible .shareholder_registration_no_label').text('Passport No. and Place of Issue');
						fields['shareholder_registration_no'] ='Passport No. and Place of Issue';
						$('.one-shareholder:visible .shareholder_registration_date_label').text('Date of Birth');

						show_errors();

						$('.one-shareholder textarea').each(function() {
							$(this).height(48);
						});

						$('#shareholder-slide div.tab.active .delete-shareholder-button').hide();
					}
				
					// Remove block from the Owner slide
					if ($('#owner-tabs div.tab').length > 1) {
						$('#owner-tabs div.tab, .one-owner').each(function() {
							if ($(this).data('person_token') === _this_id) {
								$(this).remove();
								return;
							}
						});

						if (!$('#owner-tabs div.tab.active').length) {
							$('#owner-tabs div.tab').first().addClass('active');
							$('.one-owner').each(function() {
								if ($(this).data('person_token') === $('#owner-tabs div.tab.active').data('person_token')) {
									$(this).show();
									return;
								}
							});
						}
					} else {
						// Reset tab
						$('#owner-slide div.tab').removeData('person_token');
						$('#owner-slide div.tab').addClass('active');
						$('#owner-slide div.tab p.tab-name').html('New Ultimate Beneficial Owner');
						$('#owner-slide div.tab p.person-roles').html('');

						// Reset block
						$('.one-owner').removeData('person_token');
						$('.one-owner').find('input:not([name="person[date]"]), textarea, select').each(function() { // New block
							if ($(this).parent('td').find('select.date-field').length > 0) {
								$(this).siblings('div').find('span').text('');
								$(this).siblings().hide();
								$(this).val('').show().attr({value: '', valid: 0}).show();
								$(this).siblings('select').val('').show().attr({value: '', valid: 0}).show();
							} else {
								$(this).siblings().find('span').text('');
								$(this).siblings().hide();
								$(this).val('').attr({value: '', valid: 0}).show();
							}
							show_errors();
						});
						$('.one-owner textarea').each(function() {
							$(this).height(48);
						});

						$('#owner-slide div.tab.active .delete-owner-button').hide();
					}
				} else {
					$(this).remove();
					$('.one-director').each(function() {
						if (!$(this).data('person_token')) $(this).remove();
					});
				}
				
			});
			
			// post last director
//			$('#director-slide .one-director').each(function() {
//				if (!$(this).data('person_token')) {
//					var _this = $(this);
//					var _corp = '';
//					if ($(_this).find('.director_corporate').hasClass('active')) {
//						_corp = '/1';
//					}
//					$.ajax({
//						type: 'POST',
//						url: 'http://redwood-formations.com/orders/add_person/director' + _corp,
//						dataType: 'json',
//						data: $(this).find('input, textarea').serialize(),
//						success: function(response) {
//							var _name = $(_this).find('input.director_name').val();
//							var _checked = $(_this).find('.ds-so-same-fields').is(':checked');
//							var _tab;
//							// Set director id to tab and block
//							$(_this).data('person_token', response.person_token);
//							$('#director-tabs div.tab').each(function() {
//								if (!$(this).data('person_token')) {
//									$(this).data('person_token', response.person_token);
//									_tab = $(this);
//								}
//							});
//
//
//							// Disable all inputs and textareas before hide this block			
//							$(_this).find('input:not([name="person[date]"], [name="person[owner]"], [name="person[shareholder]"], :checkbox), textarea, select').each(function() {
//								if ($(this).parent('td').find('select.date-field').length > 0) {
//									$(this).hide().siblings('select.date-field').hide();
//									$(this).siblings('div').show();
//									$(this).siblings('div').find('span').html($(this).siblings('input:hidden').val());
//								} else {
//									$(this).hide().siblings().show();
//									$(this).siblings().find('span').html($(this).val().replace(/\n/g, "<br>"));
//								}
//
//							});
//							
//							if ($(_this).find('.ds-same-fields:checkbox').is(':checked')) {
//								// Add Block to the shareholder slide
//								var _this_sh = $(_this).clone().appendTo($('#shareholder-slide'));
//
//								$(_this_sh).removeClass('one-director').addClass('one-shareholder');
//								$(_this_sh).hide();
//								$(_this_sh).find('.director-first-row').appendTo($(_this_sh).find('.main-table'));
//								$(_this_sh).find('.ds-same-fields:checkbox').parent().remove();
//								$(_this_sh).find('.ds-same-table').remove();
//
//								$(_this_sh).html($(_this_sh).html().replace(/(director_shareholder)/g, 'shareholder'));
//								$(_this_sh).html($(_this_sh).html().replace(/(director)/g, 'shareholder'));
//								$(_this_sh).html($(_this_sh).html().replace(/(Director)/g, 'Shareholder'));
//								$(_this_sh).html($(_this_sh).html().replace(/(ds\-so\-same)/g, 'so-same'));
//								$(_this_sh).data('person_token', response.person_token);
//								$(_this_sh).find('.so-same-fields').prop('checked', _checked);
//
//								$(_this_sh).find('input').each(function() {
//									var _attr_name = $(this).attr('name');
//									$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
//									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
//								});
//								$(_this_sh).find('textarea').each(function() {
//									var _attr_name = $(this).attr('name');
//									$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
//									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
//								});
//								$(_this_sh).find('.date-day').val($(_this).find('.date-day').val());
//								$(_this_sh).find('.date-month').val($(_this).find('.date-month').val());
//								$(_this_sh).find('.date-year').val($(_this).find('.date-year').val());
//								
//								// Hide the natural/corporate toggle 
//								$(_this_sh).find('.shareholder-person-toggle').hide();
//
//								// Add tab to the shareholder slide
//								var _tab_sh = $(_tab).clone().insertBefore($('button#add-shareholder-button')).data('person_token', response.person_token);
//								$(_tab_sh).html($(_tab_sh).html().replace(/(director)/g, 'shareholder'));
//								$(_tab_sh).removeClass('active');
//								
//								$('.delete-shareholder-button').show();
//							}
//
//							if ($(_this).find('.ds-so-same-fields:checkbox').is(':checked')) {
//								// Add Block to the shareholder slide
//								var _this_ow = $(_this).clone().appendTo($('#owner-slide'));
//
//								$(_this_ow).removeClass('one-director').addClass('one-owner');
//								$(_this_ow).hide();
//								$(_this_ow).find('.director-second-row').appendTo($(_this_ow).find('.main-table'));
//								$(_this_ow).find('.ds-same-fields:checkbox, .ds-so-same-fields:checkbox').parent().remove();
//								$(_this_ow).find('.ds-same-table, .ds-so-same-table, .director-person-toggle').remove();
//
//								$(_this_ow).html($(_this_ow).html().replace(/(director)/g, 'ultimate_owner'));
//								$(_this_ow).html($(_this_ow).html().replace(/(Director)/g, 'Ultimate Beneficial Owner'));
//								$(_this_ow).data('person_token', response.person_token);
//
//								$(_this_ow).find('input').each(function() {
//									var _attr_name = $(this).attr('name');
//									$(this).val($(_this).find('[name="' + _attr_name + '"]').val());
//									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
//								});
//								$(_this_ow).find('textarea').each(function() {
//									var _attr_name = $(this).attr('name');
//									$(this).text($(_this).find('[name="' + _attr_name + '"]').val());
//									$(this).attr('value', $(_this).find('[name="' + _attr_name + '"]').val());
//								});
//								$(_this_ow).find('.date-day').val($(_this).find('.date-day').val());
//								$(_this_ow).find('.date-month').val($(_this).find('.date-month').val());
//								$(_this_ow).find('.date-year').val($(_this).find('.date-year').val());
//
//								// Add tab to the shareholder slide
//								var _tab_ow = $(_tab).clone().insertBefore($('button#add-owner-button')).data('person_token', response.person_token);
//								$(_tab_ow).html($(_tab_ow).html().replace(/(director)/g, 'owner'));
//								$(_tab_ow).removeClass('active');
//								
//								$('.delete-owner-button').show();
//							}
//						}
//					});
//				}
//			});
		}
		// replace the submit with the next button
		$('.bx-next').text('Next →');
		
		// disallow tab using for not visible fields
		slider.getCurrentSlideElement().find('input, textarea, select, a').attr('tabindex', '-1');
		
		// go to the previous slide
		slider.getCurrentSlideElement('.slide').prevAll('.slide').first().height('100%');
		slider.goToPrevSlide();
		slider.getCurrentSlideElement('.slide').nextAll('.slide').first().height(1);
		
		// allow tab using for visible fields
		slider.getCurrentSlideElement().find('input, textarea, select, a').removeAttr('tabindex');
		
		// clear error list
		$('p#error-list span').empty();
		$('p#error-list #persons').empty();
		
		// enable buttons
		$('.bx-next').removeAttr('disabled');
		if (slider.getCurrentSlideElement().attr('id') === 'owner-slide') {
			$('#add-owner-button').removeAttr('disabled');
			
		} else if (slider.getCurrentSlideElement().attr('id') === 'shareholder-slide') {
			$('#add-shareholder-button').removeAttr('disabled');
		} else if (slider.getCurrentSlideElement().attr('id') === 'director-slide') {
			$('#add-director-button').removeAttr('disabled');
		}
		return false;
	});
	
	
	// Click listener for services checkbox
	$('.slide').first().on('change', 'input#services', function() {
		var _data = {};
		if (this.checked) {
			$('div#services-slide').addClass('slide').show();
			slider.reloadSlider();
			_data['order[bank_account]'] = 1;
		} else {
			$('div#services-slide').removeClass('slide');
			slider.reloadSlider();
			$('div#services-slide').hide();
			_data['order[bank_account]'] = 0;
		}
		$('#order-form').show();
		$.ajax({
			type: 'POST',
			url: 'http://redwood-formations.com/orders/add_order',
			data: _data
		});
		$('.slide').first().find('.step').text('step 1 / ' + slider.getSlideCount());
	});
	
	
	// Click listener for director checkbox
	$('.slide').first().on('change', 'input#director', function() {
		var _data = {};
		if (this.checked) {
			$('div#director-slide').removeClass('slide');
			slider.reloadSlider();
			$('div#director-slide').hide();
			_data['order[director_services]'] = 1;
		} else {
			$('div#director-slide').addClass('slide').show();
			slider.reloadSlider();
			_data['order[director_services]'] = 0;
		}
		$('#order-form').show();
		$.ajax({
			type: 'POST',
			url: 'http://redwood-formations.com/orders/add_order',
			data: _data
		});
		$('.slide').first().find('.step').text('step 1 / ' + slider.getSlideCount());
	});


	// Click listener for shareholder checkbox
	$('.slide').first().on('change', 'input#shareholder', function() {
		var _data = {};
		if (this.checked) {
			$('div#shareholder-slide').removeClass('slide');
			slider.reloadSlider();
			$('div#shareholder-slide').hide();
			_data['order[shareholder_services]'] = 1;
		} else {
			$('div#shareholder-slide').addClass('slide').show();
			slider.reloadSlider();
			_data['order[shareholder_services]'] = 0;
		}
		$('#order-form').show();
		$('.slide').first().find('.step').text('step 1 / ' + slider.getSlideCount());
		$.ajax({
			type: 'POST',
			url: 'http://redwood-formations.com/orders/add_order',
			data: _data
		});
	});
	
	
	$('#services-slide').on('change', '.posted_persons_ch', function() {
		var _data = {};
		
		if (this.checked) _data['person[authorised_signatory]'] = 1;
		else _data['person[authorised_signatory]'] = 0;
		
		$.ajax({
			type: 'POST',
			url: 'http://redwood-formations.com/orders/update_person/' + $(this).data('person_token'),
			dataType: 'json',
			data: _data
		});
	});
	
	
	$('#services-slide').on('click', '#add-signatory', function(ev) {
		ev.preventDefault();
		
		$(this).prop('disabled', true);
		
		if ($('#services-slide .one-signatory:hidden').length === 1) {
			$('.one-signatory').show();
		} else {
			$.ajax({
				type: 'POST',
				url: 'http://redwood-formations.com/orders/add_person/authorised_signatory',
				dataType: 'json',
				data: $('.one-signatory').last().find('input, textarea').serialize()
			}).done(function(response) {
				$('.one-signatory').last().data('person_token', response.person_token);
				$('.one-signatory').last().after('<hr>');
				
				$('.one-signatory').last().clone().insertBefore($('#add-signatory'));
				$('.one-signatory').last().find('select, input, textarea').val('');
			});
		}
	});
	
	
	// Click listener for persons labels
	$('p#error-list #persons').on('click', 'label', function() {
		var params = $(this).attr('for').split(':'); // %person%_id:%id%
		if (params[1] === 'undefined') params[1] = undefined;
		var slide = '#' + params[0] + '-slide'; // #%person%-slide
		var person_block = '.one-' + params[0]; // .one-%person%
		
		$(slide + ' div.tab').removeClass('active');
		$(slide + ' div.tab').each(function() {
			if ($(this).data('person_token') === params[1]) { // OR ==
				$(this).addClass('active');
			}
		});
		
		$(person_block + ':visible').hide();
		$(person_block).each(function() {
			if ($(this).data('person_token') === params[1]) { // OR ==
				$(this).show();
				show_errors();
				return;
			}
		});
		var persons = [];
		$(person_block + ':not(:visible)').each(function() {
			if ($(this).find('[valid="0"]').length !== 0) {
				var _token = $(this).data('person_token'), _this = $(this);
				$('#' + params[0] + '-tabs div.tab:not(.' + params[0] + '-deleted)').each(function() {
					if ($(this).data('person_token') === _token) {
						persons.push($(_this));
						return;
					}
				});
			}
		});
		if ($(persons).length > 0) {
			show_persons(persons, params[0]);
			var _persons_html = $('p#error-list #persons').html();
			if ($('p#error-list span').is(':empty')) $('p#error-list #persons').html(_persons_html.replace('Also, you', 'You'));
			else $('p#error-list #persons').html(_persons_html.replace('You', 'Also, you'));
		} else 
			$('p#error-list #persons').empty();
	});
});
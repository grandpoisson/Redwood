var items = [];
var items_empty = [];


$('ul#main-list li').each(function () {
	if (($(this).attr('value') != '1') && $(this).attr('value') != '2') {

		var item = new $();
		$(this).attr('id', this.textContent.toLowerCase().replace(/\s+/g, '-') + '-item');
		item = {
			item_id: $('#' + this.textContent.toLowerCase().replace(/\s+/g, '-') + '-item'),
			block_id: $('#' + this.textContent.toLowerCase().replace(/\s+/g, '-') + '-block')
		};
		items.push(item);

	} else {

		var item = new $();
		$(this).attr('id', this.textContent.toLowerCase().replace(/\s+/g, '-') + '-item');
		item = {
			item_id: $('#' + this.textContent.toLowerCase().replace(/\s+/g, '-') + '-item')
		};
		items_empty.push(item);

	}
});




$('#main-menu').mouseleave(function () {
	$('ul#main-list li[value="2"]').addClass('hovered');
});

$('div[class="submenu-container main-bg"]').mouseover(function() {
	$('ul#main-list li[value="2"]').removeClass('hovered');
});





$('ul#main-list li[value="2"]').hover(function() {

	$(items).each(function() {
		$(this.item_id).removeClass('hovered');
	});

	$(items_empty).each(function() {
		$(this.item_id).removeClass('hovered-empty');
	});

	$('ul#main-list li[value="2"]').addClass('hovered');

}, function() {

});

$(items_empty).each(function() {
	$(this.item_id).hover(function() {
		$(this).addClass('hovered-empty');
		$('ul#main-list li[value="2"]').addClass('hovered');
	}, function() {
		$(this).removeClass('hovered-empty');
	});
});


$(items).each(function () {

	var current_item = this;

	$(this.item_id).hover(function () {
		setTimeout(function () {
			$(items).each(function () {
				$(this.block_id).hide();
			});
			$('#current-page-block').addClass('hidden');

			$(current_item.block_id).show();
			
			$(items).each(function () {
				$(this.item_id).removeClass('hovered');
			});
			
			$(current_item.item_id).addClass('hovered');
			$('ul#main-list li[value="2"]').removeClass('hovered');

		}, 0);
	},
	
	function () {		
		var hoverItemId = null;

		$(document).ready(function() {
			$(current_item.block_id).mouseover(function(i) {
				hoverItemId = $(this).attr('id');
			});
		});

  		setTimeout(function () {
			if ($(current_item.block_id).attr('id') != hoverItemId) {
				$(items).each(function () {
					$(this.block_id).hide();
				});
		
				$('#current-page-block').removeClass('hidden');
		
				$(items).each(function () {
					$(this.item_id).removeClass('hovered');
				});


				// $('ul#main-list li[value="2"]').addClass('hovered');

			} else {

			}

  		}, 0);
  		// End of setTimeout
	});

	$(current_item.block_id).hover(function () {
		$(items).each(function () {
			$(this.item_id).removeClass('hovered');
		});					

		$(current_item.item_id).addClass('hovered');
	}, 

	function () {
		var isHoverItems = null;
		$(document).ready(function() {
			$(items).each(function() {
				$(this.item_id).mouseover(function () {
					isHoverItems = true;
				});
			});
		});

		setTimeout(function () {
			if (!isHoverItems) {

				$(items).each(function () {
					$(this.block_id).hide();
				});

				$('#current-page-block').removeClass('hidden');

				$(items).each(function () {
					$(this.item_id).removeClass('hovered');
				});

				$('ul#main-list li[value="2"]').addClass('hovered');

			} else {

				$(items).each(function () {
					$(this.block_id).hide();
				});
				$('#current-page-block').addClass('hidden');

				$(items).each(function () {
					$(this.item_id).removeClass('hovered');
				});
			}
		}, 0);
	});
})
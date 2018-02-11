var items = [];
var items_empty = [];


$('ul#main-list li').each(function () {
	if ($(this).attr('value') != '1') {

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


function menu (def_item) {
	$(items_empty).each(function() {
		$(this.item_id).hover(function() {
			$(this).addClass('hovered-empty');
		}, function() {
			$(this).removeClass('hovered-empty');
		});
	});

	$(items[def_item].item_id).addClass('hovered');

	$(items).each(function () {
		var current_item = this;

		$(this.item_id).hover(function () {
			setTimeout(function () {
				$(items).each(function () {
					$(this.block_id).not(items[def_item].block_id).hide();
				});
				$(items[def_item].block_id).addClass('hidden');

				if (($(current_item.block_id).attr('class')).indexOf('default-block') > -1) {
					$(current_item.block_id).removeClass('hidden');
				} else {
					$(current_item.block_id).show();
				}
				
				$(items).each(function () {
					$(this.item_id).removeClass('hovered');
				});
				
				$(current_item.item_id).addClass('hovered');

			}, 0)
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
						$(this.block_id).not(items[def_item].block_id).hide();
					});
			
					$(items[def_item].block_id).removeClass('hidden');
			
					$(items).each(function () {
						$(this.item_id).removeClass('hovered');
					});
			
					$(items[def_item].item_id).addClass('hovered');

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
				// $('#main-menu:not(li[value="1"])').mouseover(function(i) {
				// 	console.log('lala');
				// 	isHoverItems = true;
				// });
			});


			setTimeout(function () {
				if (!isHoverItems) {

					$(items).each(function () {
						$(this.block_id).not(items[def_item].block_id).hide();
					});

					$(items[def_item].block_id).removeClass('hidden');

					$(items).each(function () {
						$(this.item_id).removeClass('hovered');
					});

					$(items[def_item].item_id).addClass('hovered');

				} else {

					$(items).each(function () {
						$(this.block_id).not(items[def_item].block_id).hide();
					});
					$(items[def_item].block_id).addClass('hidden');

					$(items).each(function () {
						$(this.item_id).removeClass('hovered');
					});
				}
			}, 0)
			
		});
	})
}
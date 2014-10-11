/**
* WP Pages Scripts Required by WP Pages Plugin
* @author Kyle Phillips
*/
jQuery(function($){

	/**
	* Add the Submenu Toggles (using JS to prevent additional DB Queries)
	*/
	$(document).ready(function(){
		add_remove_submenu_toggles();
	});
	
	/**
	* Toggle the Submenus
	*/
	$(document).on('click', '.child-toggle a', function(e){
		e.preventDefault();
		var submenu = $(this).parent('.child-toggle').parent('.row').siblings('ol');
		$(this).find('i').toggleClass('np-icon-arrow-down').toggleClass('np-icon-arrow-right');
		$(submenu).toggle();
	});

	/**
	* Toggle all pages
	*/
	$(document).on('click', '.nestedpages-toggleall a', function(e){
		e.preventDefault();
		if ( $(this).attr('data-toggle') == 'closed' )
		{
			$('.nestedpages ol li ol').show();
			$(this).attr('data-toggle', 'opened');
			$(this).text('Collapse Pages');
			revert_quick_edit();
		} else
		{
			$('.nestedpages ol li ol').hide();
			$(this).attr('data-toggle', 'closed');
			$(this).text('Expand Pages');
			revert_quick_edit();
		}
	});


	/**
	* Toggle Responsive Action Buttons
	*/
	$(document).on('click', '.np-toggle-edit', function(e){
		e.preventDefault();
		var buttons = $(this).siblings('.action-buttons');
		if ( $(buttons).is(':visible') ){
			$(this).removeClass('active');
			$(buttons).hide();
		} else {
			$(this).addClass('active');
			$(buttons).show();
		}
	});

	/**
	* Remove display block on action buttons when sizing up
	*/
	var actiondelay = (function(){
		var timer = 0;
		return function(callback, ms){
			clearTimeout (timer);
			timer = setTimeout(callback, ms);
		};
	})();
	$(window).resize(function() {
		actiondelay(function(){
			$('.action-buttons').removeAttr('style');
			$('.np-toggle-edit').removeClass('active');
		}, 500);
	});

	/**
	* Make the Menu sortable
	*/
	$(document).ready(function(){
		$('.sortable').nestedSortable({
			items : 'li',
			toleranceElement: '> .row',
			handle: '.handle',
			placeholder: "ui-sortable-placeholder",
			start: function(e, ui){
        		ui.placeholder.height(ui.item.height());
    		},
    		sort: function(e, ui){
    			update_placeholder_width(ui);
    		},
    		stop: function(e, ui){
    			setTimeout(
    				function(){
    					add_remove_submenu_toggles();
    			}, 100
    			);
    			submit_sortable_form();
    		},
    		update: function(e, ui){
    		}
		});
	});

	/**
	* Update the width of the placeholder
	*/
	function update_placeholder_width(ui)
	{
		var parentCount = $(ui.placeholder).parents('ol').length;
		var listWidth = $('.sortable').width();
		var offset = ( parentCount * 40 ) - 40;
		var newWidth = listWidth - offset;
		$(ui.placeholder).width(newWidth).css('margin-left', offset + 'px');
		update_list_visibility(ui);
	}

	/**
	* Make new list items visible
	*/
	function update_list_visibility(ui)
	{
		var parentList = $(ui.placeholder).parent('ol');
		if ( !$(parentList).is(':visible') ){
			$(parentList).show();
		}
	}


	/**
	* Add or Remove the submenu toggle after the list has changed
	*/
	function add_remove_submenu_toggles()
	{
		$('.child-toggle').each(function(i, v){
			var row = $(this).parent('.row').parent('li');

			if ( $(row).children('ol').length > 0 ){
				var icon = ( $(row).children('ol:visible').length > 0 ) ? 'np-icon-arrow-down' : 'np-icon-arrow-right';
				$(this).html('<a href="#"><i class="' + icon + '"></i></a>');
			} else {
				$(this).empty();
			}
		});
	}


	/**
	* Submit Sortable Form 
	* @todo add error div, pass message to it and show on error
	*/
	function submit_sortable_form()
	{
		$('#np-error').hide();
		$('#nested-loading').show();
		list = $('ol.sortable').nestedSortable('toHierarchy', {startDepthCount: 0});

		$.ajax({
			url: ajaxurl,
			type: 'post',
			datatype: 'json',
			data: {
				action : 'npsort',
				nonce : nestedpages.np_nonce,
				list : list
			},
			success: function(data){
				if (data.status === 'error'){
					$('#np-error').text(data.message).show();
					$('#nested-loading').hide();
				} else {
					$('#nested-loading').hide();
					console.log(data);
				}
			}
		});
	}



	/**
	* ------------------------------------------------------------------------
	* Quick Edit
	* ------------------------------------------------------------------------
	**/

	// Show the form
	$(document).on('click', '.np-quick-edit', function(e){
		e.preventDefault();
		revert_quick_edit();
		set_quick_edit_data($(this));
	});

	// Cancel the form
	$(document).on('click', '.np-cancel-quickedit', function(e){
		var row = $(this).parents('.page-row');
		revert_quick_edit(row);
		e.preventDefault();
	});

	// Submit the form
	$(document).on('click', '.np-save-quickedit', function(e){
		e.preventDefault();
		$('.row').removeClass('np-updated').removeClass('np-updated-show');
		var form = $(this).parents('form');
		$(this).attr('disabled', 'disabled');
		$(form).find('.np-qe-loading').show();
		submit_np_quickedit(form);
	});


	/**
	* Set Quick Edit data
	*/
	function set_quick_edit_data(item)
	{
		var data = {
			id : $(item).attr('data-id'),
			title : $(item).attr('data-title'),
			slug : $(item).attr('data-slug'),
			author : $(item).attr('data-author'),
			cs : $(item).attr('data-commentstatus'),
			status : $(item).attr('data-status'),
			template : $(item).attr('data-template'),
			month : $(item).attr('data-month'),
			day : $(item).attr('data-day'),
			year : $(item).attr('data-year'),
			hour : $(item).attr('data-hour'),
			minute : $(item).attr('data-minute')
		};
		var newform = $('.quick-edit-form').clone().appendTo($(item).closest('.row').parent('li'));
		var row = $(newform).siblings('.row').hide();
		populate_quick_edit(newform, data);
		console.log(data);
	}


	/**
	* Populate the Quick Edit Form
	*/
	function populate_quick_edit(form, data)
	{
		$(form).find('.np_id').val(data.id);
		$(form).find('.np_title').val(data.title);
		$(form).find('.np_slug').val(data.slug);
		$(form).find('.np_author select').val(data.author);
		$(form).find('.np_template').val(data.template);
		$(form).find('.np_status').val(data.status);
		if ( data.cs === 'open' ) $(form).find('.np_cs').prop('checked', 'checked');
		
		// Date Fields
		$(form).find('select[name="mm"]').val(data.month);
		$(form).find('input[name="jj"]').val(data.day);
		$(form).find('input[name="aa"]').val(data.year);
		$(form).find('input[name="hh"]').val(data.hour);
		$(form).find('input[name="mn"]').val(data.minute);

		$(form).show();
	}


	/**
	* Remove the quick edit form and restore the row
	*/
	function revert_quick_edit()
	{
		$('.np-quickedit-error').hide();
		$('.sortable .quick-edit').remove();
		$('.row').show();
	}


	/**
	* Submit the Quick Edit Form
	*/
	function submit_np_quickedit(form)
	{
		$('.np-quickedit-error').hide();

		$.ajax({
			url: ajaxurl,
			type: 'post',
			datatype: 'json',
			data: $(form).serialize() + '&action=npquickedit&nonce=' + nestedpages.np_nonce,
			success: function(data){
				if (data.status === 'error'){
					np_remove_qe_loading(form);
					$(form).find('.np-quickedit-error').text(data.message).show();
				} else {
					np_remove_qe_loading(form);
					np_qe_update_animate(form);
					console.log(data);
				}
			}
		});
	}

	/**
	* Remove loading state from Quick Edit form
	*/
	function np_remove_qe_loading(form)
	{
		$(form).find('.np-save-quickedit').removeAttr('disabled');
		$(form).find('.np-qe-loading').hide();
	}

	/**
	* Show quick edit update animation
	*/
	function np_qe_update_animate(form)
	{
		var row = $(form).closest('.page-row').find('.row').addClass('np-updated');
		$(form).hide();
		$(row).show();
		setTimeout(function(){
			$(row).addClass('np-updated-show');
		}, 1500);
	}


}); //$
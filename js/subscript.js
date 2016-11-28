"use strict";

/*===========================================================================
							VARIABLE DECLARATION
===========================================================================*/

var simplex_data,
	result;

/*===========================================================================
							BINDING OF EVENTS
===========================================================================*/

$(document).ready(function(){
	if(!localStorage.simplex_data) return Materialize.toast("Simplex Data Not Found. Please input data.", 1500, "",
		function(){
			window.location.href = './index.html';
		});

	simplex_data = JSON.parse(localStorage.simplex_data);
	
	result = simplex.SIMPLEX_METHOD(simplex_data);

	setTimeout(function() {
		generateTables();
		generatePagination();
		populateTables(1);
		$('.solution').toggle();
	}, 600);


});

/*===========================================================================
								FUNCTIONS
===========================================================================*/

var generateTables = function(){
	var thead = $('#sol-thead'),
		tbody = $('#sol-tbody'),
		head_data = "<tr><th>&nbsp;</th>",
		body_data = "";

	for(var i=0;i<result.slacks.length;i++) head_data += '<th>'+ result.slacks[i] +'</th>';
	head_data += '</tr>';

	for(var i=0;i<=simplex_data.constraints.length;i++){
		body_data += (i==simplex_data.constraints.length) ? 
							'<td style="font-weight:bold">Z</td>' :
							'<td style="font-weight:bold">S'+ (i+1) +'</td>';
		
		for(var j=0;j<result.slacks.length;j++){
			body_data += '<td class="element"></td>'
		}
		tbody.append('<tr class="data">' + body_data + '<tr>');
		body_data = "";
	}
	

	thead.append(head_data);

};

/*===========================================================================*/

var generatePagination = function(){
	$('#pages').materializePagination({
		align: 'center',
		lastPage: result.tableau.length,
		firstPage: 1,
		useUrlParameter: false,
		onClickCallback: function(requestedPage) {
			populateTables(requestedPage);
		}
	});
};

/*===========================================================================*/

var populateTables = function(page_no){

	$('.page-btn').removeClass('active');
	$('#page-'+page_no).addClass('active');

	var index_page = page_no - 1;

	var data = $("#sol-table tr.data").map(function (index, elem) {
		var ret = [];

		$('.element', this).each(function (i) {
			var value = result.tableau[index_page][index][i];

			value = (value % 1 !=0) ? value.toFixed(4) : value;

			$(this).html(value);
		});

		return ret;
	});
};
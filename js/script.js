"use strict";

/*===========================================================================
							VARIABLE DECLARATION
===========================================================================*/

var simplex_data,
	variable_names = [],
	variables = [],
	maximize = true;


/*===========================================================================
							BINDING OF EVENTS
===========================================================================*/

$(document).ready(function(){
	$('ul.tabs').tabs();
	$('.collapsible').collapsible();
	$('select').material_select();
	$('.modal').modal();
	// localStorage.clear();
});

$('#obj-swap').click(function(){
	$('.obj-z').toggle();
	maximize = !maximize;
});

$('body').on('click','.const-swap',function(){
	$(this).closest('.const-list').attr('sign',
		$(this).closest('.const-list').attr('sign') == "less" ? "greater" : "less"
	);
	$(this).closest('.const-list').children('.const-sign').toggle();
});

$('body').on('focusout','.editable',function(){
	if( isNaN( Number( $(this).text() ) ) ){
		Materialize.toast("Please enter a valid number!", 2000);
		$(this).text("");
	}
});

$('#ultvar-add').click(function(e){addVariable()});

$('#ultvar-done').click(function(e){checkVariables(e)});

$('#const-add').click(function(e){addConstraint()});

$('#ult-solve').click(function(e){gatherAllInputs()});

$('#modal-confirm').click(function(e){solveInNewTab()});

$('#ultvar-table').on('keypress','.v-desc', function (e) {
  	if(e.which === 13){ addVariable();
		$(this).parent().next().children(':first').children(':first').focus();
	}
});

$('#ultvar-table').on('click','.ultvar-del', function () {
	$(this).parent().parent().remove();
});

/*===========================================================================
								FUNCTIONS
===========================================================================*/

var addVariable = function(){
	$('#ultvar-table').append([
		'<tr class="data">',
			'<td class="v-input v-name"><input type="text"/></td>',
			'<td class="v-input v-desc"><input type="text"/></td>',
			'<td class="v-del">',
				'<button class="btn-floating waves-effect waves-light ultvar-del red var">',
					'<i class="material-icons">clear</i>',
				'</button>',
			'</td>',
		'</tr>'
	].join(''));
};

/*===========================================================================*/

var addConstraint = function(){
	var checked = $('.check-vars:checkbox:checked'),
		temp = "";

	checked.each(function () {
		temp += '<span class="editable" contenteditable="true" placeholder="<constant>"></span>&nbsp;' +
					'<span>' + this.value + "</span> + ";
	});

	temp = temp.slice(0,-2);

	$('#const-list').append(
		['<li class="const-list row collection-item" sign="less">',
			'<span class="col s1">',
				'<button class="const-swap btn btn-floating waves-effect waves-light">',
					'<i class="material-icons">swap_vertical</i>',
				'</button>',
			'</span>',
			'<span class="col s7">',temp,'</span>',
			'<span class="const-sign col s1" style="font-size:30px;">&le;</span>',
			'<span class="const-sign col s1" style="display:none; font-size:30px;">&ge;</span>',
			'<span class="col s2 editable" contenteditable="true" placeholder="<RHS>"></span>',
		'</li>'].join('')
	);
};

/*===========================================================================*/

var checkVariables = function(e){
	e.preventDefault();
	var check = [];
	var data = $("#ultvar-supertable tr.data").map(function (index, elem) {
		var ret = [],
			item = 0;

		$('.v-input', this).each(function () {
			var d = $(this).children(':first').val() || $(this).children(':first').text();

			if(check.indexOf(d.trim()) >= 0 && item%2 == 0){
				Materialize.toast("Variable "+d+" already exist!", 2000);

				ret = [];
				check = [];
				return false;
			}else if(d.trim()==""){
				if(item%2==0) Materialize.toast("Please enter variable name at row no "+(index+1)+" !", 2000);
				else Materialize.toast("Please enter variable description for variable '"
						+ret[item-1]+"'' !", 2000);
				
				ret = [];
				check = [];
				return false;
			}else{
				ret.push(d);
				check.push(d);
				item++;
			}
		});

		return ret;
	});

	variable_names = $.grep( data, function( n, i ) {
	  return i % 2 == 0;
	});

	for (var i = 0; i < data.length; i+=2){
		variables.push({
			name : data[i],
			desc : data[i+1]
		});
	}

	if(check.length!=0){
		var equation = "",
			var_list = "",
			editable = function(id){
				return '<span id="var-'+id+'" class="editable" contenteditable="true" placeholder="<constant>"></span>'
			},
			selectable = function(id){
				return '<td style="padding:0 5px;"><input type="checkbox" class="check-vars filled-in" checked="checked"'+
							'id="list-' + id + '" value="'+ id +'"/>' + '<label for="list-' + id + '" class="black-text">' + id + '</label></td>';
			};

		for(var i = 0; i < variable_names.length; i++){
			equation += editable(variable_names[i]) + " " + variable_names[i] ;
			if(i!=variable_names.length-1) equation += " + ";

			var_list += selectable(variable_names[i]);
		}

		$('#obj-f').html(equation);
		$('#obj-f').removeAttr('style');
		$('#var-list').html(var_list);
		$('#var-list').removeAttr('style');

	}else{
		$('#obj-f').html('&lt; Please enter some Variables &gt;');
		$('#obj-f').css("color","#bdbdbd");
		$('#var-list').html('&lt; Please enter some Variables &gt;');
		$('#var-list').css("color","#bdbdbd");
	}

};

/*===========================================================================*/

var gatherAllInputs = function(){

	if(!variables.length) return Materialize.toast("Please enter some Variables", 2000);

	simplex_data = clearSimplexData();

	simplex_data.objective._Z =  maximize ? "MAX" : "MIN";
	simplex_data.objective.variables = [];
	simplex_data.objective.constants = [];
	simplex_data.objective._function = maximize ? "Maximize Z = " : "Minimize Z = ";


	for(var i=0; i<variables.length; i++){
		var constant = Number($($('#obj-f').children()[i]).text()),
			variable = variable_names[i];

		if(constant==0) constant = 1;

		simplex_data.objective.variables.push(variable);
		simplex_data.objective.constants.push(constant);
		simplex_data.objective._function += (i>0 ? " + " : "") + constant + "*" + variable;
	}

	simplex_data.variables = variables;
	
	var constraints_rows = $('.const-list');

	if(!constraints_rows.length) return Materialize.toast("Please enter some Constraints", 2000);

	for(var i=0;i<constraints_rows.length;i++){
		var rows = constraints_rows[i],
			sign = $(rows).attr("sign")=="less" ? "<=" : ">=",
			children = $(rows).children(),
			equation = $($(children)[1]).children(),
			RHS = $(children[4]).text(),
			consts = "";

		if(RHS=="") return Materialize.toast("Please enter RHS for constraint no "+ (i+1), 2000);

		consts = ($($(equation)[0]).text() || 1) + " * " + $($(equation)[1]).text();

		for(var j=2; j<equation.length; j+=2){
			consts += " + " + ($($(equation)[j]).text() || 1) + " * " + $($(equation)[j+1]).text();
		}

		consts += " " + sign + " " + RHS;

		simplex_data.constraints.push(consts);
	}

	displayModal();
};

/*===========================================================================*/

var displayModal = function(){
	$('#modal-obj').html(simplex_data.objective._function);
	$('#modal-var').html(variable_names.join(" , "));
	$('#modal-const').html(simplex_data.constraints.join("<br/>"));

	$('#confirm-modal').modal('open');
};

/*===========================================================================*/

var solveInNewTab = function(){
	localStorage.simplex_data = JSON.stringify(simplex_data);
	window.open('solution.html','_newtab');
};

/*===========================================================================*/

var clearSimplexData = function(){
	return {
		objective : {},
		variables : [],
		constraints : []
	};
};
"use strict";

var simplex_data = {},
	initial = [],
	slacks = [],
	alternate = [],
	a_flags = [],
	values = [],
	tableau = [],
	BIG_M = [],
	obj = "";

var simplex = {

	createInitialMatrix : function (data){
		simplex_data = data;

		simplex.createSlacks();

		var temp_num = 0;

		obj = simplex_data.objective._Z;

		if(obj=="MAX") temp_num = -1;
		else if(obj=="MIN") temp_num = 1;

		for (var i = 0; i < simplex_data.constraints.length; i++) {
			var temp = simplex_data.constraints[i],
				slack_val = temp.includes('<=') ? 1 : -1,
				temparr = temp.split(/[\s*(<=|>=|+|*)\s*]+/),
				initarr = new Array(slacks.length+1).join('0').split('').map(parseFloat);

			for(var j=0; j<temparr.length-1; j++){
				initarr[slacks.indexOf(temparr[j+1])] = Number(temparr[j]);
			}

			initarr[slacks.indexOf('RHS')] = Number(temparr[temparr.length-1]);
			initarr[slacks.indexOf('S'+(i+1))] = slack_val;
			initarr[slacks.indexOf('A'+(i+1))] = 1;

			initial.push(initarr);
		}

		var z_arr = new Array(slacks.length+1).join('0').split('').map(parseFloat);

		for (var j = 0; j < simplex_data.objective.variables.length; j++){
			z_arr[slacks.indexOf(simplex_data.objective.variables[j])] = 
					simplex_data.objective.constants[j] * temp_num;
		}

		z_arr[slacks.indexOf('Z')] = 1;

		initial.push(z_arr);
	},

	createSlacks : function (){

		for (var i = 0; i < simplex_data.objective.variables.length; i++){
			slacks.push(simplex_data.objective.variables[i]);
			BIG_M[i] = 1;
		}

		for (var i = 0; i < simplex_data.constraints.length; i++) {
			slacks.push("S" + (i+1));

			a_flags[i] = false;
			if(simplex_data.constraints[i].includes('>=')){
				alternate.push("A" + (i+1));
				a_flags[i] = true;
			}
		}

		for (var i = 0; i < alternate.length; i++) {
			slacks.push(alternate[i]);
		}


		var counter = 0;
		for (var i = 0; i < a_flags.length; i++) {
			if(a_flags[i]){
				BIG_M[simplex_data.objective.variables.length + i] = 1;
				BIG_M[simplex_data.objective.variables.length + a_flags.length + counter] = -1;
				counter++;
			}else{
				BIG_M[simplex_data.objective.variables.length + i] = 0;
			}
		}
		BIG_M[BIG_M.length] = 1;

		slacks.push("Z");
		slacks.push("RHS");

	},

	printTableau : function (arr){
		for(var i=0; i<arr.length;i++){
			console.log(arr[i].join("\t"));
		}
		console.log('\n');
	},

	/*===========================================================================*/

	SIMPLEX_METHOD : function(data){
		var stopping_criteria = false,
			table = [],
			temp_val = [],
			last_row = [],
			pivot_col = [],
			pivot_row = [],
			RHS = [],
			test_ratio = [],
			temp = [],
			col_elem = 0,
			row_elem = 0,
			pivot_elem = 0,
			index_PC = 0,
			index_PR = 0,
			temp_num = 0;

		simplex.createInitialMatrix(data);

		table = simplex.copy2DArray(initial);

		tableau.push(initial);

		temp_val = new Array(slacks.length).join('0').split('').map(parseFloat);

		for(var j=0; j<slacks.length-1; j++){
			temp = simplex.getCol(table,j);
			temp_num = temp.indexOf(1);

			if(Number(temp.sort().join('')) === 1){
				temp_val[j] = table[temp_num][slacks.indexOf("RHS")];
			}else{
				temp_val[j] = 0;
			}
		}

		values.push(temp_val);

		while(!stopping_criteria){

			if(obj=="MAX" && !alternate.length){
				last_row = simplex.getLastRow(table);
				col_elem = simplex.getMinimum(last_row);
				index_PC = last_row.indexOf(col_elem);
			}else if(obj=="MIN" || alternate.length){
				last_row = simplex.getLastRow(table);

				var temp_row = simplex.copy1DArray(last_row);

					for(var x=0; x<temp_row.length; x++){
						temp_row[x] = (simplex.sumAlternate(simplex.getCol(table,x)) * -1 *
										(BIG_M[x])*999999) - temp_row[x];

					}


				col_elem = simplex.getMinimum(temp_row);
				index_PC = temp_row.indexOf(col_elem);
				
				console.log(last_row);
				console.log(temp_row);
				console.log(col_elem);
				
			}

			if(col_elem >= 0) break;

			pivot_col = simplex.getCol(table, index_PC).slice(0,-1);
			RHS = simplex.getCol(table, slacks.indexOf("RHS")).slice(0,-1);

			test_ratio = simplex.divideArrayArray(RHS, pivot_col);
			row_elem = simplex.getMinimum(simplex.extractPositive(test_ratio));
			index_PR = test_ratio.indexOf(row_elem);
			pivot_row = table[index_PR];

			pivot_elem = table[index_PR][index_PC];

			pivot_row = simplex.divideArrayScalar(pivot_row,pivot_elem);
			table[index_PR] = pivot_row;

			for(var i=0; i<table.length; i++){
				if(i==index_PR) continue;
				temp = simplex.multiplyArrayScalar(pivot_row, table[i][index_PC]);
				table[i] = simplex.subtractArrayArray(table[i], temp);
			}

			temp_val = new Array(slacks.length).join('0').split('').map(parseFloat);

			for(var j=0; j<slacks.length-1; j++){
				temp = simplex.getCol(table,j);
				temp_num = temp.indexOf(1);

				if(Number(temp.sort().join('')) === 1){
					temp_val[j] = table[temp_num][slacks.indexOf("RHS")];
				}else{
					temp_val[j] = 0;
				}
			}

			for(var k=0; k<a_flags.length-1; k++){
				if(temp_val.slice(slacks.length-a_flags.length-1,-1)[k] == 0){
					a_flags[k] = false;
				}				
			}

			tableau.push(simplex.copy2DArray(table));
			values.push(temp_val);
			
			simplex.printTableau(table);
		}

		return {
			tableau : tableau,
			values : values,
			slacks : slacks,
			alternate : alternate
		};
	},

	/*===========================================================================*/
	// HELPERS

	copy1DArray : function(arr){
		var temp = [];

		for(var i=0; i<arr.length; i++){
			temp[i] = arr[i];
		}

		return temp;
	},

	copy2DArray : function(arr){
		var temp = [];

		for(var i=0; i<arr.length; i++){
			temp[i] = [];
			for(var j=0; j<arr[i].length; j++){
				temp[i][j] = arr[i][j];
			}
		}

		return temp;
	},

	getLastRow : function(arr){
		return arr[arr.length-1].slice(0,-1);
	},

	getMinimum : function(arr){
		return Math.min.apply(null, arr);
	},

	getCol : function(arr, index){
		return arr.reduce(function(a,b){
			return a.concat(b[index]);
		}, []);
	},

	extractPositive : function(arr){
		return arr.filter(function(e){
			return e > 0;
		})
	},

	hasAlternate : function(arr){
		for(var i=0; i<arr.length; i++){
			if(arr[i]) return true;
		}
		return false;
	},

	sumAlternate : function(arr){
		return arr.reduce(function(a,b,i){
			if(a_flags[i]){
				return a += b;
			}
			return a;
		}, 0);
	},

	divideArrayArray : function(arr1,arr2){
		return arr2.reduce(function(a,b,i){
			if(!isFinite(a[i]/b) || isNaN(a[i]/b) ){
				a[i] = 0;
				return a;
			}else{
				a[i] = a[i]/b;
				return a;
			}
		}, arr1);
	},

	subtractArrayArray : function(arr1,arr2){
		return arr2.reduce(function(a,b,i){
			a[i] = a[i] - b;
			return a;
		}, arr1);
	},

	divideArrayScalar : function(arr, num){
		return arr.reduce(function(a,b){
			if(!isFinite(b/num) || isNaN(b/num) ){
				return a.concat(0);
			}else{
				return a.concat(b/num);
			}
		}, []);
	},

	multiplyArrayScalar : function(arr, num){
		return arr.reduce(function(a,b){
			return a.concat(b*num);
		}, []);
	}
}
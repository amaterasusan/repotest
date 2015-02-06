$(document).ready(function() {
	
	// choose language
	$('#choose_lang').bind('change',function() {
		var loc = document.location.href;
		var pos = loc.indexOf("?");
		loc = loc.substring(0, pos);
		document.location.href = loc+"?lang="+$(this).val();
	});
	
	// check and send registration data
	$("#btn_send").bind("click",function(e) {
		var pwd, pwd1;
		var form = $(this).parents("form");
		var objError = form.parents("div").find(".error");
		if(!form.length){
			return false;
		}
		objError.html("");
		// check form
		var can = checkForm(form, objError);

		if(!can) {
			return false;
		}
		
		pwd = $("#password", form);
		pwd1 = $("#password_confirmation", form);
		// check passwords
		if(pwd.length && pwd1.length){
			if(pwd.val() != pwd1.val()){
				showError(objError, $("#error_pwd"));
				pwd1[0].focus();
				return false;
			}
		}
		// send secret token
		
		$('#secret', form).val(genRand(15,100));
		return true;
	});	
});
// help functions	
function trim(str){
	str = str.replace(/^(\s+)/gi,"");
	str = str.replace(/(\s+)$/gi,"");
	return str;
};
function showError(objError, objTextError) {
	if(objError.length && objTextError.length) {
		objError.html(objTextError.val());
	}
}
function replaceBadField(fieldValue) {
	fieldValue = stripTags(fieldValue);
	fieldValue = strip(fieldValue);
	fieldValue = fieldValue.replace(/(<)|(>)/gi,"");
	return fieldValue;
};
function strip(fieldValue) {
    return fieldValue.replace(/^\s+/, '').replace(/\s+$/, '');
};
function stripTags(fieldValue) {
    return fieldValue.replace(/<\/?[^>]+>/gi, '');
};
function isValidEmail(email, required) {
	if (required==undefined) {   // if not specified, assume its required
		required=true;
	}
	if (email==null) {
		if (required) {return false;}
		return true;
	}
	if (email.length==0) {
		if (required) {return false;}
		return true;
	}
	if (!allValidChars(email)) {  // check to make sure all characters are valid
		return false;
	}
	if (email.indexOf("@") < 1) { //  must contain @, and it must not be the first character
		return false;
	} else if (email.lastIndexOf(".") <= email.indexOf("@")) {  // last dot must be after the @
		return false;
	} else if (email.indexOf("@") == email.length) {  // @ must not be the last character
		return false;
	} else if (email.indexOf("..") >=0) { // two periods in a row is not valid
		return false;
	} else if (email.indexOf(".") == email.length) {  // . must not be the last character
		return false;
	}
	return true;
};
function checkForm(objForm, objError) {
	var arr_values = objForm.find('input, textarea, select').not("[type='submit']").not("[type='hidden']").not(':hidden');
	var len_inp = arr_values.length;
	var el,can;
	for(i=0; i<len_inp; i++) {
		el = $(arr_values[i]);
		if(el.length && el.attr('type')!="file") {
			if(typeof el.val() == "string") {
				el.val(trim(el.val()));
				el.val(replaceBadField(el.val()));
			}
			//check empty field
			if(el.attr('required')  && el.is(':visible') ) {
				if(el.val() == ""){
					showError(objError,$("#error_empty"));
					el.focus();
					return false;
				}
			}
			//check email
			if(el.attr('checkemail') == "1") {
				can = isValidEmail(arr_values[i].value);
				if(!can){
					showError(objError,$("#error_email"));
					el.focus();
					return false;
				}
			}
			// check minlength
			if(el.attr('minlength') && el.val() != "" && el.val().length < el.attr('minlength')) {
				showError(objError,$("#error_pwd_length"));
				el.focus();
				return false;
			}
		}
	}
	return true;
};
function allValidChars(email) {
	var parsed = true,
		validchars = "abcdefghijklmnopqrstuvwxyz0123456789@.-_";
	for (var i=0; i < email.length; i++) {
		var letter = email.charAt(i).toLowerCase();
		if (validchars.indexOf(letter) != -1)
			continue;
		parsed = false;
		break;
	}
	return parsed;
};
function genRand(min,max) {
    var range = max - min + 1;
    return Math.floor(Math.random()*range) + min;
}
function redirect(url) {
	if($('#host').length) {
		document.location.href = 'http://'+$('#host').val()+'/'+url;
	}
}
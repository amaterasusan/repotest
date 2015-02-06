<?php
// Include
require_once __DIR__."/common.php";

// get lang
function get_lang($chlang) {
	$path_to_lang = ROOTDIR.'/lang/'.$chlang.'/lang.ini';
	$lang = parse_ini_file($path_to_lang, true);
	
	// lang settings
	$lang['title_regform'] = (!empty($lang['title_regform'])) ? $lang['title_regform'] : 'Please Sign Up';
	$lang['display_name'] = (!empty($lang['display_name'])) ? $lang['display_name'] : 'Display Name';
	$lang['email'] = (!empty($lang['email'])) ? $lang['email'] : 'Email Address';
	$lang['password'] = (!empty($lang['password'])) ? $lang['password'] : 'Password';
	$lang['password_confirm'] = (!empty($lang['password_confirm'])) ? $lang['password_confirm'] : 'Confirm Password';
	$lang['avatar'] = (!empty($lang['avatar'])) ? $lang['avatar'] : 'Choose an avatar';
	$lang['avatar_help'] = (!empty($lang['avatar_help'])) ? $lang['avatar_help'] : 'File must have size < 2 MB, only gif, jpg, png';
	$lang['btn_register'] = (!empty($lang['btn_register'])) ? $lang['btn_register'] : 'Register';
	$lang['help_pwd_length'] = (!empty($lang['help_pwd_length'])) ? $lang['help_pwd_length'] : 'at least 8 characters';
	$lang['error_empty'] = (!empty($lang['error_empty'])) ? $lang['error_empty'] : 'Not filled out the required fields!';
	$lang['error_email'] = (!empty($lang['error_email'])) ? $lang['error_email'] : 'Incorrect email!';
	$lang['error_pwd'] = (!empty($lang['error_pwd'])) ? $lang['error_pwd'] : 'Passwords do not match!';
	$lang['error_pwd_length'] = (!empty($lang['error_pwd_length'])) ? $lang['error_pwd_length'] : 'Password must be at least 8 characters!';
	$lang['error_exists_user'] = (!empty($lang['error_exists_user'])) ? $lang['error_exists_user'] : 'This E-mail is already in the database!';
	$lang['error_flood_incorr'] = (!empty($lang['error_flood_incorr'])) ? $lang['error_flood_incorr'] : 'Incorrect!';
	$lang['error_error'] = (!empty($lang['error_error'])) ? $lang['error_error'] : 'Errors!';
	return array($chlang, $lang);
}

// default value
$chlang = DEFAULT_LANG;
$error = '';
$display_name = '';
$email = '';
$logedIn = 0;

//--- create user
$user = new user();
if($user->loggedIn()) {
	$logedIn = 1;
}

//--- logout
if(isset($_GET['logout'])) {
	if($user->loggedIn()) {
		$user->logout();
		$logedIn = 0;
	}
}

//--- set language
if( !empty($_GET['lang']) || empty($_SESSION['lang']) ) {
	$chlang = !empty($_GET['lang']) ? $_GET['lang'] : $chlang;
	list($chlang, $_SESSION['lang']) = get_lang($chlang);
	$_SESSION['lang']['lang'] = $chlang;
}

$lang = $_SESSION['lang'];


//--- Register
try{
	
	if(!empty($_POST)) {
		check_referer();
		// validate form
		list($arrErrors, $reqData) = $user->validate($_POST); 
		if(count($arrErrors)){
			$arrErrs = array();
			foreach($arrErrors as $key=>$val){
				if(!empty($lang[$key])) {
					$arrErrs[] = $lang[$key];
				} else {
					$arrErrs[] = $val;
				} 
			}
			if(count($arrErrs)){
				$error = implode("; ",$arrErrs);
			} else {
				$error = $lang['error_error'];
			}
			$display_name = (!empty($_POST['display_name'])) ? $_POST['display_name'] : "";
			$email = (!empty($_POST['email'])) ? $_POST['email'] : "";

			throw new Exception($error);
		} else {
			$user->create($reqData); 
			$logedIn = 1;
		}
		//
	}
	
} catch(Exception $e) {
	$error = $e->getMessage();
}	
?>
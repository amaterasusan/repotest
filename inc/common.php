<?
require_once(dirname(__FILE__).'/defines.php');
require_once(ROOTDIR.'/lib/config.php');
set_error_handler("trig_error");
session_start();
/***************************/
// autoload class
function __autoload($class) {
	if(!class_exists($class)) {
		if(strstr($class, PEAR_NameScheme_bar)) {
			// if class such XML_Parser -> XML/Parser.php
			$pathclass = name2Path($class, true);
			if(is_file($pathclass)) {
				include_once($pathclass);
			} else {
				trigger_error("ERROR ->NOT such file $class");
			}	
		} else {
			// in other case we try to include file from lib
			$libdir   = defined("LIBDIR") ? LIBDIR : "lib";
			if(is_file(ROOTDIR."/$libdir/$class.php")) {
				include_once(ROOTDIR."/$libdir/$class.php"); 
			} else {
				trigger_error("ERROR ->NOT such file ".ROOTDIR."/$libdir/$class.php");
			}	
		}
	}
}

/***************************/
function trig_error($errno="", $msg_error, $myfile="", $myline="") {
	if (error_reporting() == 0) return;
	$aerr['msg'] = $msg_error;
	$aerr['error_code'] = $errno;
	$aerr['error_file'] = $myfile;
	$aerr['error_line'] = $myline;
	$aerr['is_send_message'] = 0;
	$error = new error($aerr);
	return true;
}

/***************************/
/**
 * Samples:
 * name2Path("PEAR", true)   -> /usr/lib/php/PEAR.php
 * name2Path("pEaR", true)   -> no match (on Unix)
 * name2Path("PEAR")         -> PEAR.php
 * name2Path("XML_Parser")   -> XML/Parser.php
 */
function name2Path($classname, $absolutize = false) {
	$fname = str_replace(PEAR_NameScheme_bar, '/', $classname) . 
             '.' . PEAR_NameScheme_ext;
	foreach (getInc($absolutize) as $libDir) {
		$path = $libDir . '/' . $fname;
		if (file_exists($path)) {
			if (!$absolutize) return $fname;
			else return $path;
		}
	}
	return false;
}
function getInc($absolutize = false) {
	$sep = defined("PATH_SEPARATOR")? PATH_SEPARATOR : 
		((strtoupper(substr(PHP_OS, 0, 3)) == 'WIN')? ";" : ":");
	$inc = explode($sep, ini_get("include_path"));
	if ($absolutize) $inc = array_map("realpath", $inc);
	return str_replace("\\", "/", $inc);
}

/***************************/
/**
* Приведение ссылки к абсолютному URI
*
* @param string $link ссылка (абсолютный URI, абсолютный путь на сайте, относительный путь)
* @param string $base базовый URI (можно без "http://")
* @return string абсолютный URI ссылки
*/
function absolute2uri($abslink) {
	$init_addr    = get_address();
	$server_root  = preg_replace('/.?\:/si',"",$_SERVER['DOCUMENT_ROOT']);
	$abslink      = preg_replace('/.?\:/si',"",$abslink);
	$pos          = strpos($abslink,$server_root);
	if($pos = strpos($abslink,$server_root) !== false) {
		$link     = "http://".$init_addr["HOSTNAME"].substr($abslink,strlen($server_root));
		return $link;
	}	
	return false;
}

/***************************/
function get_ip_address() {
	global $REMOTE_ADDR;
	if(empty($REMOTE_ADDR)) $REMOTE_ADDR = "";
	$client_ip = (!empty($_SERVER['REMOTE_ADDR'])) ? $_SERVER['REMOTE_ADDR'] : 
				 (( !empty($_ENV['REMOTE_ADDR'])) ? $_ENV['REMOTE_ADDR'] : $REMOTE_ADDR );
	//proxy
	$ip = getenv("HTTP_X_FORWARDED_FOR");
	if($ip != '' ) {
		$aip = explode(',', $ip);
		reset($aip);
		while (list(, $entry) = each($aip)){
			$entry = trim($entry);
			if ( preg_match("/^([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/", $entry, $ip_list) ) {
				$private_ip = array('/^0\./', '/^127\.0\.0\.1/', '/^192\.168\..*/', '/^172\.((1[6-9])|(2[0-9])|(3[0-1]))\..*/', '/^10\..*/', '/^224\..*/', '/^240\..*/');
				$found_ip = preg_replace($private_ip, $client_ip, $ip_list[1]);
				if($client_ip != $found_ip) {
					$client_ip = $found_ip;
					break;
				}
			}
		} 
	}
	return $client_ip;
}
function get_address() {
	global $REMOTE_ADDR,$HTTP_USER_AGENT,$HTTP_REFERER,$PHP_SELF;
	$client_ip = get_ip_address();
	$client_agent = ( !empty($_SERVER['HTTP_USER_AGENT']) ) ? $_SERVER['HTTP_USER_AGENT'] : ( ( !empty($_ENV['HTTP_USER_AGENT']) ) ? $_ENV['HTTP_USER_AGENT'] : $HTTP_USER_AGENT );
	$client_self = ( !empty($_SERVER['PHP_SELF']) ) ? $_SERVER['PHP_SELF'] : ( ( !empty($_ENV['PHP_SELF']) ) ? $_ENV['PHP_SELF'] : $PHP_SELF );
	$pos=strrpos($client_self,"/");	
	$rest = substr($client_self,$pos+1);
	$dir_self=str_replace ($rest, "", $client_self);
	$http_host = ( !empty($_SERVER['HTTP_HOST']) ) ? $_SERVER['HTTP_HOST'] : gethostbyaddr($client_ip);
	$init_array['HOSTNAME'] = str_replace("'","",$http_host); 
	$init_array['IP_ADDR'] = $client_ip;
	$init_array['USER_AGENT'] = str_replace("'","",$client_agent); 
	$init_array['SELF'] = $client_self;   
	$init_array['DIR_SELF'] = $dir_self;   
	return $init_array;
}

/***************************/

/**
 * check HTTP_REFERER - protecting from hackers
 */

function check_referer() {
	if ((isset($_POST) || isset($_GET)) && isset($_SERVER['HTTP_REFERER']) && strlen($_SERVER['HTTP_REFERER'])) {  
		$refer = parse_url($_SERVER['HTTP_REFERER']);  
		if (FALSE === strpos($refer['host'], $_SERVER['SERVER_NAME']) &&  
         	FALSE === strpos($refer['host'], $_SERVER['HTTP_HOST'])) {  
			die('ERROR ->Invalid HTTP_REFERER!');  
     	}  
	}
}
/***************************/

/**
 * check file_name - protecting from hackers
 */
function check_filename( $filename) {
	$result=(substr($filename,0,1)!='/' && substr($filename,0,1)!='\\');
	if ($result) {
		$test=array('..','://','~','`','\'','"',':',';',',','&','>','<');
		for ($i=0, $count=count($test); $i<$count && $result; $i++) {
			$result=(strpos($filename,$test[$i])===false);
		}
	}
	return $result;
}

/***************************/
function replaceBadSymbols($s_in) {
	$search = array ("/<script[^>]*?>.*?<\/script>/si",  
        	         "/([\r\n])[\s]+/");
	$replace = array ("",
        	          "\\1");

	$s_in 	= preg_replace($search, $replace, $s_in);
	$s_in 	= preg_replace("/\\\/", "", $s_in);
	return $s_in;
}

/***************************/
function trim_excess_chars($text,$max_chars) {
	if(function_exists("mb_strlen")) {
		if(mb_strlen($text,"UTF-8")>$max_chars) {
			$text = mb_substr($text,0,$max_chars,"UTF-8")."...";
		}	
	} else {
		if(strlen($text>$max_chars)) $text = substr($text,0,$max_chars)."...";
	}	
	return $text;
}

/***************************/
function stringSearch($patternStart, $patternEnd, $stringNeedle) {
	$str  = "";
	$pos2 = 0;
	$pos = ($patternStart!=="") ? strpos($stringNeedle,$patternStart) : 0;
	$len = strlen($patternStart);
	if($pos === false) {
		$pos = 0;
		$len = 0;
	}
	if($patternEnd!=="") {
		$pos2 = strpos($stringNeedle,$patternEnd);
		if($pos2 === false) {
			$pos2 = 0;
		}
		$str = substr($stringNeedle,$pos+$len,$pos2-($pos+$len));
	} else {
		$str = substr($stringNeedle,$pos+$len);
	}
	return $str;
}
function checkEmail($email = "") {
	if(function_exists("filter_var")){
		return filter_var($email, FILTER_VALIDATE_EMAIL);
	} else 	{
		if (ereg("[[:alnum:]]+@[[:alnum:]]+\.[[:alnum:]]+", $email)) {
			return true;
		} else {
			return false;
		}
	}
}
?>
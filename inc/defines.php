<?
$curdir   = str_replace("\\","/",dirname(__FILE__));	
$arr_path = explode("/",$curdir);
$innerdir = (count($arr_path)>=1)?$arr_path[count($arr_path)-1]:"inc";
$realdir  = stringSearch("","/$innerdir",$curdir);	
//path
$adress   = get_address();
$path     = substr($adress['HOSTNAME'].$adress['DIR_SELF'],0,-1);
/***************************/
define('DIRSEP', '/');
define('ROOTDIR',$realdir);
define('INNERDIR',$innerdir);
define('HOST',$path);
define('LIBDIR','lib');
define('DBSERVER', 'localhost');
define('DBUSER','root');
define('DBPASS','');
define('DBNAME','testreg');	
define('DEFAULT_LANG','en');
define('PEAR_NameScheme_ext', 'php');
define('PEAR_NameScheme_bar', '_');
define('DIRUPLOAD',ROOTDIR."/avatars");
define('LOGDIR',ROOTDIR.'/log');
?>
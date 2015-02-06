<?php
/**
* Abstract class for load class/object
* this useful when trying to use the singleton method on a class that extends another class.
*
*/
abstract class db_factory {
	private static $instances;
	public static function getInstance($module_name, $arr_param = array()) {
	
		if (!isset(self::$instances[$module_name])) {
			self::valid($arr_param);
			$newInstance = null;
			$class = new ReflectionClass($module_name);
			try {
				$newInstance = call_user_func(array(&$class,"newInstance"),$arr_param);
			} catch	(Exception $e) {
				trigger_error("ERROR ->".$e->getMessage());
			} 
			self::$instances[$module_name] = $newInstance;
		
		}
		
		return self::$instances[$module_name];
		
	}
	public static function valid($arr_param) {
		if(!is_array($arr_param)) { 
			trigger_error("ERROR ->Arguments to initialize the database should be an array!");
		}	
		if(count($arr_param)<4) { 
			trigger_error("ERROR ->The number of arguments is less than needed!");
		}	
	}
}
?>
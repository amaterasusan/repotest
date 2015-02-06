<?php
/**
 * MySQL database class
 * Contains the MySql class for MySQL handling extends class DB.
 * @author	Helen Nikitina <amaterasu.san@gmail.com>
 * @license	GPL-2
 * @access  public
 * @copyright Copyright (C)
 */
include_once(dirname(__FILE__)."/dbbase.php");
class db_mysql extends db_dbbase {
	public $error="";
	protected $sql;
	protected $data;
	protected $dbtype;
	protected $dbserver;
	protected $dbname;
	protected $dbuser=null;
	protected $dbpass=null;
	private $cnn;
	private $logdir;
	private $strError="Error!";
	
	/**
	 * Constructor function.
	 */
	public function __construct() {
		if(defined("LOGDIR")) {
			$this->logdir = LOGDIR;
			if(!is_dir($this->logdir)){
				@mkdir($this->logdir,0777);
			}
		} else {
			$this->logdir = "/";
		}
		$this->logdir  .= (substr($this->logdir,-1) !="/")? "/" : "";
		$this->logfile  = $this->logdir.'error_mysql.log';
		if(isset($_SESSION['arrTranslations']['error_error'])) {
			$this->strError = $_SESSION['arrTranslations']['error_error'];
		}
		$arr = func_get_args();
		$len = func_num_args();
		if($len ==0) throw new Exception("The argument passed is empty array!");
		$res = parent::__construct($arr[0]);
	}
	
	/**
	 * connect to database and choose db
	 */
	protected function connect() {
		$this->cnn = @mysql_connect($this->dbserver, $this->dbuser, $this->dbpass);
		if(!is_resource($this->cnn)) {
			throw new Exception(mysql_error());
			return false;
		}
		$rs=@mysql_select_db($this->dbname,$this->cnn);
		if(!$rs) {
			throw new Exception(mysql_error());
		}
		return true;
	}
	
	/**
	 * select db
	 */
	public function select_db($dbname) {
		$rs=@mysql_select_db($dbname,$this->cnn);
		if(!$rs) {
			$this->error = mysql_error();
			return false;
		}
		$this->dbname = $dbname;
		return true;
	}
	
	/**
	 * Use exec() to execute SQL.
	 * @param string sql, may be empty if $this->sql not empty
	 * @return resource mysql_query()
	 */
	public function exec($ssql="") {
		if($ssql != "") {
			$this->sql=$ssql;
		}
		if(empty($this->sql)) {
			trigger_error("ERROR ->Sql query is empty!");
		}
		$result = @mysql_query($this->sql, $this->cnn);
		if(!$result) {
			$this->error_writelog($this->sql."\r\n".mysql_error());
			$this->error = "ERROR ->".mysql_error();
			return false;
		}
		return $result;
	}
	
	/**
	 * Use fetch() to execute SQL and get result as hash.
	 * @param string sql, may be empty if $this->sql not empty
	 * @return hash with data from dbtable
	 */
	public function fetch($ssql="") {
		$this->data = array();
		if($ssql != "") {
			$this->sql=$ssql;
		}
		if(empty($this->sql)) {
			trigger_error("ERROR ->Sql query is empty!");
		}
		$result = $this->exec();

		while ($row = @mysql_fetch_array($result, MYSQL_ASSOC)) {
			$this->data[] = $row;
		}
		return $this->data;
	}
	
	/**
	 * string mysql_make_qw($query, $arg1, $arg2, ...)
	 * This function creates SQL-query pattern $query,
	 * containing placeholders.
	 * @param string $query SQL query
	 * @param string $args
	 */
	public function mysql_make_qw() {
		$args = func_get_args();
		// Getting to $ tmpl links to the query template.
		$tmpl =& $args[0];
		$tmpl = str_replace("%", "%%", $tmpl);
		$tmpl = str_replace("?", "%s", $tmpl);
		foreach ($args as $i=>$v) {
			if (!$i) continue;        // it's query
			if (is_int($v)) continue; // integers does not need to escape
			$args[$i] = "'".mysql_real_escape_string($v)."'";
		}
		/*
		* In any case, fill the 20 last arguments invalid values
		* if the number of "?" exceeds the number of parameters,
		* an error occurred SQL-query (help in debugging).
		*/
		for ($i=$c=count($args)-1; $i<$c+20; $i++)
			$args[$i+1] = "UNKNOWN_PLACEHOLDER_$i";
		// We form SQL-query.
		return call_user_func_array("sprintf", $args);
	}
	
	/**
	 * The function performs the query to MySQL and exec query.
	 * Parameter $query may contain such signs as ?,
	 * instead of them will are substituted values
	 * arguments $arg1, $arg2 and etc, escaped and concluded in apostrophes
	 * @param string $query SQL query
	 * @param string $args
	 * usage:
	 * 	mysql_qw('DELETE FROM table WHERE name=?', $name)
	 */
	public function mysql_qw() {
		$args      = func_get_args();
		$query     = call_user_func_array(array($this, 'mysql_make_qw'), $args);
		$this->sql = "";
		$this->exec($query);
	}
	
	/**
	 * The function performs the query to MySQL,
	 * exec query and return the result as array
	 * Parameter $query may contain such signs as ?,
	 * instead of them will are substituted values
	 * arguments $arg1, $arg2 and etc, escaped and concluded in apostrophes
	 * @param string $query SQL query
	 * @param string $args
	 * @return hash $arr_res from database
	 * usage:
	 * 	mysql_fetch('SELECT * FROM table WHERE name=?', $name)
	 */
	public function mysql_fetch() {
		$args      = func_get_args();
		$query     = call_user_func_array(array($this, 'mysql_make_qw'), $args);
		$this->sql = "";
		$arr_res   = $this->fetch($query);
		return $arr_res;
	}
	
	/*
	 * mysql_get_count
	 * get count of records that satisfy selection criteria in $where.
	 * @param string $tablename
	 * @param string $where = name='Helen'
	 * @return int count rows
	 */
	public function mysql_get_count ($tablename, $where) {
		if (preg_match('/^select/si', $where)) {
			// $where starts with 'SELECT' so use it as a complete query
			$this->sql = $where;
		} else {
			// does not start with 'SELECT' so it must be a 'where' clause
			$this->sql = "SELECT count(*) FROM $tablename WHERE $where";
		} // if
		$result = @mysql_query($this->sql);
		if(!$result)	{
			$this->error_writelog($this->sql."\r\n".mysql_error());
			$this->error = "ERROR ->".mysql_error();
			return false;
		}
		// if 'GROUP BY' was used then return the number of rows
		return mysql_num_rows($result);
		/*
		if (stristr($this->sql,"group by")) {
			return mysql_num_rows($result);
		} else {
			return (int)$query_data[0];
		}
		*/
	}
	
	/**
	 * INSERT
	 * insert a record using the contents of $arrfield.
	 * @param string $tablename
	 * @param array $arrValues("field11"=>"value1","field2"=>"value2")
	 * @returns affected rows
	 */
	public function insert($tablename, $arrValues,$ifexistsUpdate=0,$fieldUnique="") {
		$aff_rows=0;
		$fields = array_keys($arrValues);
		$values = array_values($arrValues);
		$escVals = array();
		foreach($values as $value) {
		    $value = "'" . mysql_real_escape_string($value) . "'";
			$escVals[] = $value;
		}
		$sql = "INSERT INTO $tablename (";
		$sql .= join(', ', $fields);
		$sql .= ') VALUES(';
		$sql .= join(', ', $escVals);
		$sql .= ')';
		if($ifexistsUpdate && $fieldUnique!="") {
			if(isset($arrValues[$fieldUnique])) {
				unset($arrValues[$fieldUnique]);
			}
			$arrUpdates = array();
			foreach($arrValues as $field => $value) {
			    if(!is_numeric($value)) {
				    $value = "'" . mysql_real_escape_string($value) . "'";
				}
				$arrUpdates[] = "$field = $value";
			}

			$sql .= ' ON DUPLICATE KEY UPDATE '.join(",",$arrUpdates);
		}
		$this -> sql= $sql;

		ignore_user_abort(true);
		$res = @mysql_query($this -> sql);
		ignore_user_abort(false);
		if(!$res) {
			$this->error_writelog($this->sql."\r\n".mysql_error());
			$this->error = "ERROR ->".mysql_error();
			return false;
		}
		//$aff_rows = mysql_affected_rows($this->cnn);
		return mysql_insert_id();
	}
	
	/**
	* UPDATE
	* update a record using the contents of $arrFieldValues
	* @param string $tablename
	* @param array $arrFieldValues("field11"=>"value1","field2"=>"value2")
	* @param array or string $Conditions
	* $Conditions may be array likes this array('id' => 5, 'salary' => 1000) or
	* string likes this "name like '%bob%'"
	*/
	public function update($tablename, $arrFieldValues, $Conditions) {
		$aff_rows = 0;
		$arrUpdates=array();
		foreach($arrFieldValues as $field => $value) {
		    $value = "'" . mysql_real_escape_string($value) . "'";
			$arrUpdates[] = "$field = $value";
		}
		$where="";
		if(is_array($Conditions)) {
			$arrWhere = array();
			foreach($Conditions as $field => $value) {
				$value = "'" . mysql_real_escape_string($value) . "'";
				$arrWhere[] = "$field = $value";
			}
			$where = join(' AND ', $arrWhere);
		} else if(is_string($Conditions)) {
			$where = $Conditions;
		}
		$sql  = "UPDATE $tablename SET ";
		$sql .= join(', ', $arrUpdates);
		if($where!=""){
			$sql .= " WHERE $where";
		}
		$sql .= "  LIMIT 1";

		//echo $sql;
		$this -> sql= $sql;
		ignore_user_abort(true);
		$res = @mysql_query($this -> sql);
		ignore_user_abort(false);
		if(!$res) {
			$this->error_writelog($this->sql."\r\n".mysql_error());
			$this->error = "ERROR ->".mysql_error();
			return false;
		}
		$aff_rows = mysql_affected_rows($this->cnn);
		$this->numrows = $aff_rows;
		return $aff_rows;
	}
	
	// return the last page number for retrieved rows.
	public function getLastPage() {
		return (int)$this->lastpage;

	}
	
	// return the number of rows retrived for the current page.
	public function getNumRows() {
		return (int)$this->numrows;
	}
	
	// get current page number to be retrieved for a multi-page display
	public function getPageNo(){
		if (empty($this->pageno)) {
			return 0;
		} else {
			return (int)$this->pageno;
		}
	}
	
	// this allows a particular page number to be selected
	public function setPageNo($pageno = '1') {
		$this->pageno = (int)$pageno;
	}
	
	// set encoding
	public function setEncoding() {
		$this->exec("SET NAMES utf8");
        $this->exec("SET COLLATION_CONNECTION=utf8_general_ci");
	}

	public function getColumns($tbl) {
		$query = "SHOW COLUMNS FROM ".$tbl;
		if(($result = @mysql_query($query, $this->cnn))) {
			/* Store the column names retrieved in an array */
			$arr_columns = array();
			$i = 0;
			while ($row = mysql_fetch_array($result)) {
				$arr_columns[$i]['name'] = $row['Field'];
				$arr_columns[$i]['type'] = $row['Type'];
				$arr_columns[$i]['extra'] = $row['Extra'];
				$i++;
			}
			return $arr_columns;
		} else {
			return 0;
		}
	}
	
	public function type_field($field,$tbl) {
		$ssql = 'SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = "'.$this->dbname.'" AND TABLE_NAME = "'.mysql_real_escape_string($tbl).'" AND COLUMN_NAME = "'.mysql_real_escape_string($field).'" LIMIT 0,1';
		$result = @mysql_query($ssql, $this->cnn);
		$res = "";
		$total = mysql_fetch_array($result);
		if(count($total)){$res = $total[0];}
		return $res;
	}

	public function close(){
		@mysql_close($this->cnn);
	}
	
	public function __destruct(){
		@mysql_close($this->cnn);
	}
	
	private function error_writelog($msg_log){
		$info      = "Time: ".$this->get_datetime()."\r\n";
		$str       = $info.$msg_log."\r\n"."***********************************\r\n";
		if ($fh = @fopen($this->logfile, "a+"))	{
			$puts = fputs($fh, $str);
			fclose($fh);
		}
	}
	private function get_time()	{
		return(@date("H:i", time() + $this->timeoffset));
	}
	private function get_date()	{
		return(@date("Y-m-d", time() + $this->timeoffset));
	}
	private function get_datetime()	{
		return $this->get_date()." ".$this->get_time();
	}
}
?>
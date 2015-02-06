<?
class db_dbbase {
	protected $dbtype;
	protected $dbserver;
	protected $dbname;
	protected $dbuser=null;
	protected $dbpass=null;
	public function __construct($arr = array()) {
		foreach($arr as $key=>$val){
			$this->$key = $val;
		}	
		// Do 
		if(!isset($this->dbserver)){
			throw new Exception("Not set parameter 'dbserver'");
		}
		if(!isset($this->dbuser)){
			throw new Exception("Not set parameter 'dbuser'");
		}
		if(!isset($this->dbpass)){
			throw new Exception("Not set parameter 'dbpass'");
		}
		if(!isset($this->dbname)){
			throw new Exception("Not set parameter 'dbname'");
		}
		$this->connect();
	}
	protected function connect(){
		/*
		echo "<pre>";
		print_r(get_declared_classes());
		echo "</pre>";
		*/
	}
	/**
	* dump() produces an HTML table of the data. It is useful for debugging.
	* This is also a good example of how to work with the data array.
	* @param array $arr_data,  may be empty if $this->data[] not empty
	*/
	public function dump($arr_data = array()) {
		if(count($arr_data)!=0) {
			$this->data = $arr_data;
		}	
		if(count($this->data) ==0) {
			trigger_error("ERROR ->dump(): no rows exist!");
			return false;
		}	
		$str = "";
		$str.= "<style>
				table.table_dump{
					margin-top:20px;
					font-family:Tahoma;
					font-size:12px;
					border-collapse: collapse;
					empty-cells: show;
					border-bottom: 1px solid #C1C5CC;
					border-left: 1px solid #C1C5CC;
					border-right: 1px solid #C1C5CC;
					CLEAR: left;}";
		$str.= "table.table_dump TR{
					BORDER-TOP-WIDTH: 0px;
					PADDING-RIGHT: 0px;
					PADDING-LEFT: 0px;
					BORDER-LEFT-WIDTH: 0px;
					BORDER-BOTTOM-WIDTH: 0px;
					PADDING-BOTTOM: 0px; MARGIN: 0px;
					PADDING-TOP: 0px;
					BORDER-RIGHT-WIDTH: 0px}";
		$str.= "table.table_dump TD{
					padding: 0.5em;
					border: 1px solid #CCC;
					BORDER-RIGHT: #336 1px solid;
					BORDER-BOTTOM: #336 1px solid;}";
		$str.= "table.table_dump TH{
					font-size: 13px;
					color: #344460;
					BORDER-RIGHT: #336 1px solid;
					BORDER-BOTTOM: #336 1px solid;
					BACKGROUND-COLOR: #c3ced3;
					padding: 0.5em;}";
		$str.= "table.table_dump TR.rowodd {background-color: #dde5eb;}";			
		$str.= "table.table_dump TR.roweven {background-color: #e8ecf1;}";			
		$str.= "</style>";
		$str.= "<table class=\"table_dump\" border=\"1\" cellpadding=\"1\" cellspacing=\"0\">\n";
		$str.= "<tr>";
		$str.= "<th>#</th>";
		foreach($this->data[0] as $key=>$val) {
			$str.= "<th><b>";
			$str.= $key;
			$str.= "</b></th>";
		}
		$str.= "</tr>\n";
		$row_cnt = 0;
		foreach($this->data as $row) {
			$row_cnt++;
			$class = (floor($row_cnt%2) == 0)?"rowodd":"roweven";
			$str.= "<tr align='center' class='".$class."'>";
			$str.= "<td>".$row_cnt."</td>";
			foreach($row as $val) {
				$str.= "<td align='left'>&#160;";
				$str.= $val;
				$str.= "</td>";
			}
			$str.= "</tr>\n";
		}
		$str.= "</table>\n";
		print $str;
	}
}
?>
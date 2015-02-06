<?
/**
* class Error
* (C) 2005 Helen Nikitina
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
* See http://www.gnu.org/copyleft/lesser.html
*/

/**
* PHP version 5
* class Error
* debug==0  Errors will be printed,written in the (log)file and sent by the mail
* debug==1  Errors will be printed
* debug==2  Errors will be written in the (log)file
* debug==3  Errors will be printed and written in the (log)file
* debug==4  Errors will be sent by the mail (only WARNING)
* @since 18 october 2005
* @version 1.0
* @author Helen Nikitina <amaterasu.san@gmail.com>
*/
class error
{
	public $debug = 1;
	private $head_msg = "";
	private $msg = "";
	private $tech_error_email   = "amaterasu.san@gmail.com";
	private $user_error_email   = "amaterasu@miaterra.ru";
	private $default_from_email = "administrator@miaterra.ru";
	private $logdir;
	private $logfile;
	private $timeoffset = 0;
	private $error_code = 0;
	private $error_file = "";
	private $error_line = 1;
	private $error_exit = 0;
	private $debug_backtrace = 0;
	private $is_send_message = 0;
	private $is_view_file = 1;
	
	/**
	* Constructor function.
	*/
	public function __construct($errors = array()) {
		if(defined("LOGDIR")) {
			$this->logdir = LOGDIR;
			if(!is_dir($this->logdir)) {
				@mkdir($this->logdir,0777) or die("ERROR -> can not create user {$this->logdir}");
			}
		} else {
			$this->logdir       = "/";
		}
		$this->logdir          .= (substr($this->logdir,-1) !="/")? "/" : "";
		$this->logfile          = $this->logdir.'error.log';
		$this->timeoffset       = 0;
		//
		foreach($errors as $key => $value) {
			$this->$key = $value;
		}
		if (strstr($this->msg,"ERROR ->")) {
			$this->msg = str_replace("ERROR ->","",$this->msg);
			$this->error_exit = 1;
			$this->head_msg="ERROR: ";
		}
		$this->error_handler();
	}
	
	/**
	* Error handler
	*/
	private function error_handler() {
		if($this->error_exit!=1){
			if ($this->error_code == E_WARNING)	{
				$this->head_msg="WARNING: ";
			} else if ($this->error_code == E_USER_NOTICE) {
				$this->head_msg="NOTICE: ";
			} else if ($this->error_code == E_USER_ERROR) {
				$this->head_msg="MY ERROR: ";
			} else if ( ($this->error_code == E_NOTICE) or (error_reporting() == 0) ) {
				$this->head_msg="NOTICE: ";
			}
		}
		switch ($this->debug) {
			case 0:
				$this->display_error();
				$this->error_writelog();
				$this->error_mail();
				break;
			case 1:
				$this->display_error();
				break;
			case 2:
				$this->error_writelog();
				break;
			case 3:
				$this->display_error();
				$this->error_writelog();
				break;
			case 4:
				if ($this->error_code == E_WARNING || $this->error_code == E_USER_ERROR){
					$this->error_mail();
				}
				break;
			default:
				$this->display_error();
				break;
		}
		if($this->error_exit) die();
		return true;
	}
	
	/**
	* display error
	*/
	private function display_error() {
		$add_msg = ($this->is_send_message)?"Please send this error on <a href='mailto:".$this->user_error_email."'>".$this->user_error_email."</a>":"";
		$msg_ = "<p><b style='color:#ff0000'>".$this->head_msg."</b><br /><b>".$this->msg."</b><br>";
		if($this->is_view_file) {
			$msg_ .= "In ".$this->error_file." (line ".$this->error_line.")<br />".$add_msg."</p>";
		}
		print ($msg_);
	}
	
	/**
	* send error by mail
	*/
	private function error_mail() {
		$email     = $this->user_error_email;
		$mail_subj = "Error reporting";
		if ($this->error_code == E_WARNING) {
			$email=$this->tech_error_email;
			$mail_subj="Technical error";
		}

		$msg_email="<br>"."<b style='color:#ff0000'>".$this->head_msg."</b><b>".$this->msg."</b><br>".
			 	   "In ".$this->error_file." (line ".$this->error_line.")<br>";

		$html_header = "MIME-Version: 1.0\r\n";
		$html_header.= "Content-type: text/html; charset=iso-8859-1\r\n";
		if(isset($_SESSION['user_name']) && $_SESSION['user_email']) {
			$html_header.= "From: ".$_SESSION['user_name']." <".$_SESSION['user_email'].">\r\n";
		} else {
			$html_header.= "From: administrator <".$this->default_from_email.">\r\n";
		}
		$init_addr	 = get_address();
		$ip			 = $init_addr['IP_ADDR'];
		$host		 = $init_addr['HOSTNAME'];
		$info = "Time: ".$this->get_datetime()."<br>".
				"Remote IP: ".$ip."<br>".
				"Host: ".$host."<br>";
		@mail($email, $mail_subj, $info.$msg_email,$html_header) or die("Cannot send mail!");
	}
	
	/**
	* write error to the file(log)
	*/
	private function error_writelog() {
		$msg_log   = $this->head_msg.$this->msg."\r\n".
			 	    "In ".$this->error_file." (line ".$this->error_line.")\r\n\r\n";
		$init_addr = get_address();
		$ip		   = $init_addr['IP_ADDR'];
		$host	   = $init_addr['HOSTNAME'];
		$info      = "Time: ".$this->get_datetime()."\r\n".
				     "Remote IP: ".$ip."\r\n".
				     "Host: ".$host."\r\n";
		$backtrace = ($this->debug_backtrace)?parse_backtrace(debug_backtrace()):"";
		$str       = $info.$msg_log.$backtrace.
					 "***********************************\r\n";
		if ($fh = @fopen($this->logfile, "a+"))	{
			$puts = fputs($fh, $str);
			fclose($fh);
		}
	}
	
	private function get_time()	{
		return(date("H:i", time() + $this->timeoffset));
	}
	
	private function get_date()	{
		return(date("Y-m-d", time() + $this->timeoffset));
	}
	
	private function get_datetime()	{
		return $this->get_date()." ".$this->get_time();
	}
}
?>
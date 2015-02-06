<?
/**
* class user
* @version 1.0
* @author Helen Nikitina <amaterasu.san@gmail.com>
*/
class user{

	// Private ORM instance
	private $handledb;
	private $error;
	
	/**
	 * Constructor
	 */
	public function __construct() {
		// connect to db
		if(!$this->connectDB()) {
			return false;
		}
	}
	
	/**
	 * Connect to db
	 */
	public function connectDB() {
		if(defined('DBSERVER')) $db_server = DBSERVER;
		if(defined('DBUSER')) $db_user = DBUSER;
		if(defined('DBPASS')) $db_pass = DBPASS;
		if(defined('DBNAME')) $db_name = DBNAME;
		if(!empty($db_server) && !empty($db_user) && ! empty($db_name)){
			$dbarr = array( "dbserver"=>$db_server,
							"dbuser"=>$db_user,
							"dbpass"=>$db_pass,
							"dbname"=>$db_name);
			$handledb = db_factory::getInstance('db_mysql',$dbarr);
			if(!is_object($handledb)) {
				$this->error = $handledb;
				return false;
			}			
			$this->handledb = $handledb;
			return true;
		} else {
			$this->error = "Could not connect to database!";
			return false;
		}
	}
	
	/**
	 * Get User Info From DB by $_SESSION['loginid']
	 */	
	public function getInfo() {
		$res = array();
		if(empty($_SESSION['loginid'])) {
			return false;
		}
		$userid = mysql_real_escape_string($_SESSION['loginid']);
		$this->handledb->setEncoding();
		$res = $this->handledb->mysql_fetch('select nick, email, avatar from users where id="'.$userid.'"');
		if(!count($res)) {
			return false;
		}
		return $res[0];
	}
	
	/**
	 * validate post vars
	 * @param array $post
	 * @return array($errors, $reqData)
	 */
	public function validate($post) {
		$arrError = array();
		foreach($post as $key=>&$val) {
			$val = trim($val);
			$val = replaceBadSymbols($val);
		}
		
		extract($post);
		
		$display_name = (!empty($display_name)) ? htmlspecialchars(stripslashes($display_name)): "";
		$email = (!empty($email)) ? stripslashes(strtolower($email)) : "";
		$fpwd = (!empty($password)) ? htmlspecialchars(stripslashes($password)) :"";
		
		/* 
		    we fill the secret field with js to avoid attacks by hackers 
			secret number can not be 0
		*/
		if(empty($secret) || !($secret>=15 && $secret<=100)) {
			$arrError['error_flood_incorr'] = 1;
		}
		
		if(empty($display_name) || empty($email) || empty($fpwd) || empty($password_confirmation) ) {
			
			// error empty fields
			$arrError['error_empty'] = 1;
			
		} else {
			
			// error email
			if(!checkEmail($email)) {
				$arrError['error_email'] = 1;
			}
			
			// if password < 8 chars
			if(strlen($fpwd)<8){
				$arrError['error_pwd_length'] = 1;
			}
			
			// error pwd != pwd1
			if($fpwd != $password_confirmation) {
				$arrError['error_pwd'] = 1;
			}
			if($this->exists($email)) {
				$arrError['error_exists_user'] = 1;
			}
			
			// upload file and check
			$avatar = 'net-avatara.gif';
			if (!empty($_FILES['fupload']['name'])) {
				$uploadedFile = $_FILES['fupload']['tmp_name'];
				$file         = $_FILES['fupload']['name'];
				$real_ext     = strtolower(strrchr ($file, "." ));
				if($real_ext == ".jpe" || $real_ext == ".jpeg") $real_ext=".jpg";
				if(!is_dir(DIRUPLOAD)) {
					if(!@mkdir(DIRUPLOAD,0777)){
						$arrError['error_create_dir'] = 'ERROR -> can not create user dir';
					}
				}
				$target_file  = DIRUPLOAD.'/'.$file;
				$pict_handler = new picture_support(array("dir"=>DIRUPLOAD,"file"=>$file));
				$res_upload  = $pict_handler->uploadPicture($uploadedFile,$target_file,$real_ext);

				if(!$res_upload) {
					$arrError['error_upload'] = $pict_handler->error;
				}
				if(!count($arrError)){
					// check size
					$size  = getimagesize($target_file);
					$w = $size[0];
					$h = $size[1];
					$maxw = (defined("MAXSIZEAVATAR"))?MAXSIZEAVATAR:100;
					if($w <= $maxw && $h <= $maxw){
						$date   = time();
						$avatar = $date.$real_ext;
						// simply rename uploded file
						rename ($target_file, DIRUPLOAD.DIRSEP.$avatar);
					} else {
						// square resize img
						$avatar_f = $pict_handler->squareResizeImg(DIRUPLOAD);
						if(!$avatar_f){
							$arrError['error_image'] = $pict_handler->error;
						} else {
							$avatar = $avatar_f;
						}
						unlink($target_file);
					}
				}
			}
		}
		return array(
			$arrError, 
			array(
				'nick'=>$display_name, 
				'email'=>$email, 
				'password'=>$fpwd, 
				'avatar'=>$avatar
			)
		);
	 }
	
	/**
	 * Check whether such user exists
	 * @param string $email 
	 * @return boolean
	 */
	public function exists($email){
		// Does the user exist in the database?
		$this->handledb->setEncoding();
		$res_email = $this->handledb->mysql_fetch("SELECT email from users where email = '".$email."'");
		
		//--- such email already exists
		if(count($res_email)){
			return true;
		}
		return false;
	}


	/**
	 * Create new user and save in the database
	 * @param array $reqData
 	 * @return void
	 */
	public function create($reqData) {
		if(count($reqData)) {
			$reqData['password'] = strrev(md5($reqData['password']));
		}		
		$reqData['registerDate'] = @date("Y-m-d H:i:s",time());
		$reqData['activation'] = '1';
		$this->handledb->setEncoding();
		//----- insert user
		$this->userid  = $this->handledb->insert('users', $reqData);
		$this->login();
		/*
			Here we would have to send email with account activation code.
			But now we will not do this, this is just a test
		*/
		// Account activation code
		// $activation = md5($insert_id).md5($fnick);
		// send email with Account activation code.
	}


	/**
	 * Login this user
	 * @return void
	 */
	public function login() {
		
		// Mark the user as logged in
		$_SESSION['loginid'] = $this->userid;
		// Update the last_login db field
	}

	/**
	 * Destroy the session and logout the user.
	 * @return void
	 */
	public function logout(){
		$_SESSION = array();
		unset($_SESSION);
	}

	/**
	 * Check whether the user is logged in.
	 * @return boolean
	 */
	public function loggedIn(){
		return isset($_SESSION['loginid']);
	}
}
?>
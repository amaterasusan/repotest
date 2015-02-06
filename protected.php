<?
require_once 'inc/manager.php';
$info = array('nick'=>'', 'email'=>'', 'avatar'=>'net-avatara.gif');
$isUser = 1;
if(!empty($user)){
	$info = $user->getInfo();
	if(!$info){
		$isUser = 0;
	}
}
?>
<!DOCTYPE html>
<html>

	<head>
		<meta charset="utf-8"/>
		<title>Protected page</title>
		<!-- The main CSS file -->
		<link href="css/style.css" rel="stylesheet" />
		<script src="//code.jquery.com/jquery-1.10.2.min.js"></script>
	    <script src="js/main.js"></script>	
		<!--[if lt IE 9]>
			<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
		<![endif]-->
	</head>

	<body>
    	<input type="hidden" value="<?=HOST?>" name="host" id="host" />
		<? if(!$isUser) {?>
        <script>
			redirect('index.php?logout=1');
		</script>
        <? }?>
		<div id="protected-page">
			<img src="avatars/<?=$info['avatar']?>" alt="avatar" style="max-height:100px" />
			<h1><?=$lang['lang_hello']?></h1>
			<p>Nick: <b><?=$info['nick']?></b></p><br />
			<p>Email: <b><?=$info['email']?></b></p><br />
			<a href="index.php?logout=1" class="logout-button">Logout</a>
		</div>

	</body>
</html>
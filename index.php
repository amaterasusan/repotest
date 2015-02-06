<?
require_once 'inc/manager.php';
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
    <title>Register</title>
    <link href="//netdna.bootstrapcdn.com/bootstrap/3.1.0/css/bootstrap.min.css" rel="stylesheet" id="bootstrap-css" />
    <link href="css/style.css" rel="stylesheet" />
    <script src="//code.jquery.com/jquery-1.10.2.min.js"></script>
    <script src="js/main.js"></script>
	<!--[if lt IE 9]>
		<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
	<![endif]-->
</head>
<body>
<input type="hidden" value="<?=HOST?>" name="host" id="host" />

<? if (!empty($logedIn) && $logedIn == 1) { ?>

<script>
	redirect('protected.php');
</script>

<? } else {?>

<!-- error lang msg for js -->
<input type="hidden" value="<?=$lang['error_empty']?>" name="error_empty" id="error_empty" />
<input type="hidden" value="<?=$lang['error_email']?>" name="error_email" id="error_email" />
<input type="hidden" value="<?=$lang['error_pwd']?>" name="error_pwd" id="error_pwd" />
<input type="hidden" value="<?=$lang['error_pwd_length']?>" name="error_pwd_length" id="error_pwd_length" />
<input type="hidden" value="<?=$lang['error_exists_user']?>" name="error_exists_user" id="error_exists_user" />

<div class="container-fluid">
<div class="row-fluid">
<div class="centering">

<div class="col-xs-12 col-sm-8 col-md-6 col-sm-offset-2 col-md-offset-3">
<div class="panel panel-default">
	<div class="panel-body">
    	<div class="row">
        	<div class="error"><?=$error?></div>
        </div>
    	<h3><?=$lang['title_regform']?></h3>
	    <hr class="colorgraph" />
		<form role="form" method="post" action="index.php" enctype="multipart/form-data">
        	<input type="hidden" name="secret" id="secret" value="0" />
        	<div class="row">
            	<div class="col-xs-12 col-sm-6 col-md-6">
					<div class="form-group">
                    	<select id="choose_lang" name="choose_lang" class="form-control input-lg">
                            <option value="en"<? if ($lang['lang'] == "en"){ ?> selected="selected"<? }?>>English</option> 
                            <option value="ru"<? if ($lang['lang'] == "ru"){ ?> selected="selected"<? }?>>Русский</option> 
                        </select> 
					</div>
				</div>
            </div>
            <div class="form-group">
				<div class="input-group">
					<input type="text" name="display_name" id="display_name" class="form-control input-lg" placeholder="<?=$lang['display_name']?>" tabindex="3" value="<?=$display_name?>" required /><span class="input-group-addon"><span class="glyphicon glyphicon-asterisk"></span></span>
				</div>
            </div>    
			<div class="form-group">
            	<div class="input-group">
					<input type="email" name="email" id="email" class="form-control input-lg" placeholder="<?=$lang['email']?>" tabindex="4" value="<?=$email?>" checkemail="1" required />
                    <span class="input-group-addon"><span class="glyphicon glyphicon-asterisk"></span></span>
                </div>    
			</div>
			<div class="row">
				<div class="col-xs-12 col-sm-6 col-md-6">
					<div class="form-group">
                    	<div class="input-group">
							<input type="password" name="password" id="password" class="form-control input-lg" placeholder="<?=$lang['password']?>" minlength="8" tabindex="5" required />
                            <span class="input-group-addon"><span class="glyphicon glyphicon-asterisk"></span></span>
                        </div>
                        <p class="help-block" style="padding-left:10px"><?=$lang['help_pwd_length']?></p>
					</div>
                    
				</div>
				<div class="col-xs-12 col-sm-6 col-md-6">
					<div class="form-group">
                    	<div class="input-group">
							<input type="password" name="password_confirmation" id="password_confirmation" class="form-control input-lg" placeholder="<?=$lang['password_confirm']?>" minlength="8" tabindex="6" required />
                            <span class="input-group-addon"><span class="glyphicon glyphicon-asterisk"></span></span>
                        </div>    
					</div>
				</div>
			</div>
            
            <div class="row">
	            <div class="col-xs-12">
					<div class="form-group">
                    	<h4><?=$lang['avatar']?></h4>
						<input type="file" id="fupload" name="fupload" />
						<p class="help-block"><?=$lang['avatar_help']?></p>
					</div>
				</div>
            </div>    
			<hr class="colorgraph" />
			<div class="row">
				<div class="center-block" style="width:300px"><input type="submit" value="<?=$lang['btn_register']?>" class="btn btn-primary btn-block btn-lg" id="btn_send" tabindex="7"></div>
				
			</div>
		</form>
	</div>
</div>
</div>

</div>
</div>
</div>
<? }?>
</body>
</html>
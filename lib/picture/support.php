<?
class picture_support {
	
	public $destimage;
	public $newWidth=0;
	public $newHeight=0;
	public $srcw_crop=0;
	public $srch_crop=0;
	public $srcX=0;
	public $srcY=0;
	public $file;
	public $dir;
	public $error = "";
	private $strerror = array();
	
	/**
	 * Constructor
	 * @param array $pictures such as array("dir"=>DIRUPLOAD,"file"=>$file)
	 */ 
	public function __construct($pictures = array()) {
		if(count($pictures)!=0)	{
			foreach($pictures as $key => $value){
				$this->$key = $value;
			}
		}
		$this->strerror[0] = 'ERROR -> Invalid file type';
		$this->strerror[1] = 'ERROR -> File size > 2 MB';
		$this->strerror[2] = $this->strerror[3] = 'ERROR -> An error has occurred. Please try again later.';
	}
	
	/**
	 * upload picture
	 * @param string $src
	 * @param string $dest
	 * @param string $ext
	 * @return boolean result
	 */
	public function uploadPicture($src, $dest, $ext){
		$max_image_size	= 2000 * 1024;
		$valid_types 	=  array(".gif",".jpg",".jpeg", ".png", ".peg");
		$res = $this->upload($src,$dest,$ext,$max_image_size,$valid_types);
		return $res;
	}
	
	/**
	 * upload file
	 * @param string $src
	 * @param string $dest
	 * @param string $ext
	 * @return boolean result
	 */
	public function uploadFile($src, $dest, $ext) {
		$max_image_size	= 2000 * 1024;
		$valid_types 	=  array(".txt",".pdf",".doc", ".docx",".gif",".jpg",".jpeg", ".png", ".peg",".htm",".html");
		$res = $this->upload($src,$dest,$ext,$max_image_size,$valid_types);
		return $res;
	}

	/**
	 * upload 
 	 * @param string $src
	 * @param string $dest
	 * @param string $ext
	 * @param numeric $max_image_size
	 * @param array $valid_types such as array(".gif",".jpg",".jpeg")
	 * @return boolean result
	 */
	public function upload($src, $dest, $ext, $max_image_size, $valid_types) {
		if (is_uploaded_file($src)) {
			if (!in_array($ext, $valid_types)) {
				$this->error = $this->strerror[0];
				return false;
			}
			if (filesize($src) > $max_image_size) {
				$this->error = $this->strerror[1];
				return false;
			} else {
				$this->newWidth  = 0;
				$this->newHeight = 0;
				if(	$size = @getimagesize($src) ){
					$this->newWidth  = $size[0];
					$this->newHeight = $size[1];
				}
				if (!@move_uploaded_file($src, $dest)) {
					$this->error = $this->strerror[2];
					return false;
				}
			}
		} else {
			$this->error = $this->strerror[2];
			return false;
		}
		return true;
	}
	
	/**
	 * copy picture
	 */
	public function copyPicture($src, $dest, $is_remove) {
		if (!@copy($src, $dest)) return false;
		if($is_remove) unlink($src);
		$size = getimagesize($dest);
		$this->newWidth=$size[0];
		$this->newHeight=$size[1];
		return true;
	}

	/**
	 * resize picture
	 */
	public function ratioResizeImg($newName) {
		$ffile=$this->dir."/".$this->file;
		$srcImage = $this->CreateImgFrom($ffile);
		if(!$srcImage) {
			return false;
		}
		$srcWidth = imagesx( $srcImage );
		$srcHeight = imagesy( $srcImage );
		$prop=$srcWidth/$srcHeight;

		$dw_crop=$this->srcw_crop;
		$dh_crop=$this->srch_crop;
		if($dw_crop!=0 && $dh_crop!=0) {
			$this->newWidth = $dw_crop;
			$srcWidth = $dw_crop;
			$this->newHeight = $dh_crop;
			$srcHeight = $dh_crop;
		}
		$destImage=$this->CreateImg($this->newWidth,$this->newHeight);
		if(!$destImage) {
			return false;
		}
		imagealphablending($destImage, false);
		$this->addAntilalias($destImage);
		$destImage = $this->ResizeImg($destImage,$srcImage,$this->srcX,$this->srcY,$this->newWidth,$this->newHeight,$srcWidth, $srcHeight);
		if(!$destImage){
			return false;
		}
		imagesavealpha($destImage, true);
		$ext  = strtolower(strrchr ( $this->file , "." ));
		if(empty($newName)) {
			$newName = time();
		}
		if( (!strcasecmp ($ext, ".jpg")) ||
		    (!strcasecmp ($ext, ".jpeg")) ||
		    (!strcasecmp ($ext, ".jpe")))
			@imagejpeg($destImage, $this->dir."/".$newName.$ext, 100);
		else
			@imagepng($destImage, $this->dir."/".$newName.$ext);
		@imagedestroy($srcImage);
		@imagedestroy($destImage);
		return true;
	}
	
	/**
	 * Creating a square
	 */
	public function squareResizeImg($path_to_file){
		$w     = (defined("MAXSIZEAVATAR"))?MAXSIZEAVATAR:90;  
		$ffile = $this->dir."/".$this->file;
		$date  = time();
		$ext   = strtolower(strrchr ( $ffile , "." ));
		if($ext == ".jpe" || $ext == ".jpeg") $ext=".jpg";
		$srcImage = $this->CreateImgFrom($ffile);
		if(!$srcImage) {
			return false;
		}
		// 	calculate the width and height of the image
		$w_src = imagesx($srcImage);
		$h_src = imagesy($srcImage);

		// create an empty square image
		$destImage=$this->CreateImg($w,$w);
		imagealphablending($destImage, false);
		$this->addAntilalias($destImage);

		// cut out the middle of a square to x, if a horizontal photo
		if ($w_src > $h_src) {
			@imagecopyresampled($destImage, $srcImage, 0, 0,
								round((max($w_src,$h_src)-min($w_src,$h_src))/2),
		                        0, $w, $w, min($w_src,$h_src), min($w_src,$h_src));
		}
		
		// cut a square on top of y,
		// if a vertical photo (although you can also midway)
		if ($w_src<$h_src) {
			@imagecopyresampled($destImage, $srcImage, 0, 0, 0, 0, $w, $w,
								min($w_src,$h_src), min($w_src,$h_src));
		}
		
		// square image is scaled without clippings
		if ($w_src==$h_src) {
			@imagecopyresampled($destImage, $srcImage, 0, 0, 0, 0, $w, $w, $w_src, $w_src);
		}

		// save images to the desired folder name is the current time.
		// avatars don't have the same name.
		imagesavealpha($destImage, true); // to preserve transparency in gif / png images
		if(!strcasecmp ($ext, ".png") || !strcasecmp ($ext, ".gif")) {
			@imagepng($destImage, $path_to_file."/".$date.$ext);
		} else {
			@imagejpeg($destImage, $path_to_file."/".$date.$ext);
		}
		@imagedestroy($srcImage);
		@imagedestroy($destImage);
		return $date.$ext;
	}
	
	/**
	 * rotate picture
	 */
	public function rotateImage($angle){
		$ffile = $this->dir."/".$this->file;
		$srcImage = $this->CreateImgFrom($ffile);
		if(!$srcImage){
			return false;
		}
		$width  = imagesx($srcImage);
		$height = imagesy($srcImage);
		$rotate = imagerotate($srcImage, $angle, 0);
		return $rotate;
		//imagejpeg($rotate, $ffile, 100);
	}
	
	/*========= CreateImgFrom ===========
	 	0 - /width             .
	 	1 - /height.
	 	2 -  1 = GIF, 2 = JPG, 3 = PNG, 4 = SWF
	 	3 -  height="yyy" width="xxx",   IMG.
	*====================================*/
	public function CreateImgFrom($fl) {
		$can = true;
		$img = null;
		$sz = getimagesize($fl); //  get type
		switch ($sz[2]):
		case 1:
			if(function_exists('imagecreatefromgif'))
				$img = @imagecreatefromgif( $fl );
			else
				$can = false;
			break;
		case 2:
			if(function_exists('imagecreatefromjpeg'))
				$img = @imagecreatefromjpeg( $fl );
			else
				$can = false;
			break;
		case 3:
			if(function_exists('imagecreatefrompng'))
				$img = @imagecreatefrompng( $fl );
			else
				$can = false;
			break;
		default:
			$can = false;
		endswitch;
		if(!$can){
			$this->error = $this->strerror[0];
			return false;
		}
		return $img;
	}
	
	public function CreateImg($x=50, $y=50)	{
		$can = true;
		$img = null;
		if ( function_exists( 'imagecreatetruecolor' ) )
			$img = imagecreatetruecolor($x, $y);
		elseif ( function_exists( 'imagecreate' ) )
			$img = imagecreate($x, $y);
		else
			$can = false;
		if(!$can){
			$this->error = $this->strerror[3];
			return false;
		}
		return $img;
	}
	
	public function ResizeImg($dst_im, $src_im, $crp_x, $crp_y, $req_w, $req_h, $crp_w, $crp_h ) {
		$can = true;
		if  ( function_exists( 'imagecopyresampled' ) )
			imagecopyresampled($dst_im, $src_im, 0, 0, $crp_x, $crp_y, $req_w, $req_h, $crp_w, $crp_h);

		elseif ( function_exists( 'imagecopyresized' ) )
			imagecopyresized($dst_im, $src_im, 0, 0, $crp_x, $crp_y, $req_w, $req_h, $crp_w, $crp_h);
		else
			$can = false;
		if(!$can){
			$this->error = $this->strerror[3];
			return false;
		}
		return $dst_im;
	}
	
	public function addAntilalias($img) {
		if ( function_exists( 'imageantialias' ) )
			imageantialias($img, true);
	}
	
	public function dircopy($srcdir, $dstdir) {
		$num = 0;
		if(!is_dir($dstdir)) {
			$this->error = 'ERROR ->'.$srcdir.' is not a folder!';
			return false;
		}
		if($curdir = opendir($srcdir)) {
			while($file = readdir($curdir)) {
				if($file != '.' && $file != '..') {
					$ext = strrchr ( $file , "." );
					// Image
					if((!strcasecmp ($ext, ".gif")) || (!strcasecmp ($ext, ".jpg")) || (!strcasecmp ($ext, ".png")) || (!strcasecmp ($ext, ".bmp")) || (!strcasecmp ($ext, ".jpeg"))||(!strcasecmp ($ext, ".jpe"))) {
						$srcfile = $srcdir . $file;
						$dstfile = $dstdir . $file;
						if(is_file($srcfile)) {
							if(@copy($srcfile, $dstfile)) {
								$num++;
							} else {
								$this->error = 'ERROR -> File '.$srcfile.' could not be copied!';
								return false;
							}
						}
					}
				}
			}
			closedir($curdir);
		}
		return $num;
	}
	
	public function cleantmp($directory) {
		if( !$dirhandle = @opendir($directory) ) {
			return false;
		}
		while( false !== ($filename = @readdir($dirhandle)) ) {
			if( $filename != "." && $filename != ".." ) {
				$filename = $directory. "/". $filename;
				if(is_file($filename)) {
					unlink($filename);
				}
			}
		}
	}
}
?>
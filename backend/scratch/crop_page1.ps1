Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Users\alale\.gemini\antigravity-ide\brain\b4ae965a-c1bd-4996-8268-00f2244294dd\.user_uploaded\media_1790541019593.png')
$w = $img.Width
$h = $img.Height
Write-Host "Dimensions: $w x $h"

# Page 1 table is roughly in the top 20% of the image, let's crop the top section with high detail
$cropH = [int]($h / 5)
$rect = New-Object System.Drawing.Rectangle(0, 0, $w, $cropH)
$bmp = New-Object System.Drawing.Bitmap($w, $cropH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
$bmp.Save('C:\Users\alale\OneDrive\Desktop\work\Taqniya-SMS\backend\scratch\page1_cropped.png', [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Host "Page 1 saved."

# Generates the EV-vs-Gas calculator OG card (1200x630) with a CENTERED,
# crop-safe layout: brand + pill + headline + benefit chips + subtitle all live
# in the middle ~630px square, so it reads well as LinkedIn's large card AND its
# square small-card crop. Output: public/og/calculator.jpg
Add-Type -AssemblyName System.Drawing
$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'ClearTypeGridFit'
$g.InterpolationMode = 'HighQualityBicubic'

$white = [System.Drawing.Color]::White
$blue  = [System.Drawing.Color]::FromArgb(11, 95, 212)
$green = [System.Drawing.Color]::FromArgb(31, 150, 80)
$accent = [System.Drawing.Color]::FromArgb(74, 222, 128)

# --- diagonal blue->green gradient background ---
$rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
$lg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $blue, $green, 40)
$g.FillRectangle($lg, $rect)
# soft texture circles
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20,255,255,255))), 880, -170, 540, 540)
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(13,255,255,255))), 980, 330, 420, 420)

function RoundRect($x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

$sfC = New-Object System.Drawing.StringFormat
$sfC.Alignment = 'Center'; $sfC.LineAlignment = 'Center'
$wb = New-Object System.Drawing.SolidBrush($white)

# --- brand row (bolt badge + name), centered ---
$fBrand = New-Object System.Drawing.Font('Segoe UI', 30, [System.Drawing.FontStyle]::Bold)
$name = 'Electrifying the US'
$nsz = $g.MeasureString($name, $fBrand)
$badge = 60; $gap = 16
$rowW = $badge + $gap + $nsz.Width
$rowX = ($W - $rowW) / 2
$rowY = 70
$g.FillPath($wb, (RoundRect $rowX $rowY $badge $badge 15))
$cx = $rowX + $badge / 2; $cy = $rowY + $badge / 2
$bolt = @(
  (New-Object System.Drawing.PointF(($cx + 5), ($cy - 18))),
  (New-Object System.Drawing.PointF(($cx - 11), ($cy + 3))),
  (New-Object System.Drawing.PointF(($cx - 1), ($cy + 3))),
  (New-Object System.Drawing.PointF(($cx - 5), ($cy + 18))),
  (New-Object System.Drawing.PointF(($cx + 11), ($cy - 3))),
  (New-Object System.Drawing.PointF(($cx + 1), ($cy - 3)))
)
$g.FillPolygon((New-Object System.Drawing.SolidBrush($blue)), $bolt)
$nameRect = New-Object System.Drawing.RectangleF(($rowX + $badge + $gap), $rowY, $nsz.Width, $badge)
$sfL = New-Object System.Drawing.StringFormat
$sfL.Alignment = 'Near'; $sfL.LineAlignment = 'Center'
$g.DrawString($name, $fBrand, $wb, $nameRect, $sfL)

# --- pill: EV vs GAS CALCULATOR ---
$fPill = New-Object System.Drawing.Font('Segoe UI', 17, [System.Drawing.FontStyle]::Bold)
$pillTxt = 'EV  vs  GAS  CALCULATOR'
$psz = $g.MeasureString($pillTxt, $fPill)
$pillW = $psz.Width + 56; $pillH = 46
$pillX = ($W - $pillW) / 2; $pillY = 168
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(46,255,255,255))), (RoundRect $pillX $pillY $pillW $pillH 23))
$g.DrawString($pillTxt, $fPill, $wb, (New-Object System.Drawing.RectangleF($pillX, $pillY, $pillW, $pillH)), $sfC)

# --- headline (two centered lines) ---
$fHead = New-Object System.Drawing.Font('Segoe UI', 70, [System.Drawing.FontStyle]::Bold)
$g.DrawString('See how much', $fHead, $wb, (New-Object System.Drawing.RectangleF(0, 250, $W, 96)), $sfC)
$g.DrawString("you'll save",  $fHead, $wb, (New-Object System.Drawing.RectangleF(0, 338, $W, 96)), $sfC)
# accent underline under line 2, centered
$accH = $g.MeasureString("you'll save", $fHead)
$accW = $accH.Width - 24
$g.FillPath((New-Object System.Drawing.SolidBrush($accent)), (RoundRect (($W - $accW) / 2) 438 $accW 8 4))

# --- benefit pill (single centered capsule with 3 dot-separated benefits) ---
$fChip = New-Object System.Drawing.Font('Segoe UI', 17, [System.Drawing.FontStyle]::Bold)
$dot = [char]0x2022
$chipTxt = "Fuel   $dot   Maintenance   $dot   Incentives"
$csz = $g.MeasureString($chipTxt, $fChip)
$capW = $csz.Width + 52; $capH = 44
$capX = ($W - $capW) / 2; $capY = 474
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36,255,255,255))), (RoundRect $capX $capY $capW $capH 22))
$g.DrawString($chipTxt, $fChip, $wb, (New-Object System.Drawing.RectangleF($capX, $capY, $capW, $capH)), $sfC)

# --- subtitle + domain, centered ---
$fSub = New-Object System.Drawing.Font('Segoe UI', 19, [System.Drawing.FontStyle]::Regular)
$g.DrawString('Real U.S. energy prices, state by state.', $fSub, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235,255,255,255))), (New-Object System.Drawing.RectangleF(0, 538, $W, 30)), $sfC)
$fDom = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
$g.DrawString('ElectrifyingTheUS.com', $fDom, $wb, (New-Object System.Drawing.RectangleF(0, 572, $W, 30)), $sfC)

# --- save as JPEG q90 ---
$out = "C:\Users\lemue\OneDrive\Desktop\CLAUDE CODE\Electrifying the US\public\og\calculator-new.jpg"
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 90L)
$bmp.Save($out, $enc, $ep)
$g.Dispose(); $bmp.Dispose()
"Wrote $out"

#
# Filename "tetrisInPowershell.ps1"
# Example for rendering screen.
#
# Created by:    Magic Mao
# Created date:  2011-07-14
#

 

$speaker = New-Object -ComObject "SAPI.SpVoice";
$voices = $speaker.GetVoices();
$winPosition = $host.ui.rawui.WindowPosition;
$winSize = $host.ui.rawui.WindowSize;

$blockX = 10; $blockY = 10; $blockW = 16;$blockH = 20;
$nextBlockX = $blockX + $blockW + 10; $nextBlockY = $blockY;
$framework = New-Object Management.Automation.Host.Rectangle;
$blockFrame =  New-Object Management.Automation.Host.Rectangle;
$point = New-Object Management.Automation.Host.Coordinates;
$rect = New-Object Management.Automation.Host.Rectangle;

$fgc = $Host.UI.RawUI.ForegroundColor;
$bgc = $Host.UI.RawUI.BackgroundColor;

$border = $null; # handle for border buffer
$blocks = @(); # seven basic blocks;
[System.ConsoleColor[]]$blockColors = @(
[System.ConsoleColor]::Gray,       #The color gray.
#[System.ConsoleColor]::Blue,        #The color blue.
[System.ConsoleColor]::Green,       #The color green.
[System.ConsoleColor]::Cyan,       #The color cyan (blue-green).
[System.ConsoleColor]::Red,        #The color red.
[System.ConsoleColor]::Magenta,    #The color magenta (purplish-red).
[System.ConsoleColor]::Yellow,      #The color yellow.
[System.ConsoleColor]::White        #The color white.
); # handle of block colors
$blockChar = "#";
$nextBlock = $null; # handle for next block;
[Int32]$nextBlockRotation = 0; # rotation of the next block;
$nextBlockBuffer = $null; # handle for next block buffer;
[Int32]$nextBlockColor = -1; # next block color index
$currentBlock = $null; #handle for current block;
[Int32]$currentBlockRotation = 0; # rotation of the current block;

[Int32]$currentBlockX = 0; [Int32]$currentBlockY = 0; # location of current block
[Int32]$currentBlockColor = -1; # current block color index
$turndelay = 400;
$currentRunFrameBuffer = $null; # handle for current run block
[Int32]$totalScore = 0;

function main(){
  Introduction;
  Start-Sleep -s 5;
  InitEnvironment;
  # Backup UI
  $script:uiBackup = $Host.UI.RawUI.GetBufferContents($framework);
  StartGame;
  # Restore UI
  Draw 0 0 $uiBackup;
}



#
# Brief introduction
#
function Introduction(){
  Speak 0 -2 "What should we do next?";
  Speak 1 0 "How about PC games?";
  Speak 0 2 "Yeah! i love it!";
}
function Speak([Int32]$index, [Int32]$rate, [String]$words){
  $speaker.Rate = $rate;
  $speaker.Voice = $voices.Item($index);
  $color = switch($index){0 {"Red"} default {"Yellow"}};
  $speaker.Speak($words, 1) | Out-Null;
  Write-Host $words -ForegroundColor $color
  $speaker.WaitUntilDone(60000) | Out-Null;
}

#
# Draw the formated buffer start from the [x,y]
#
function Draw($x, $y, $buffer){
  $point.x = $x; $point.y = $y;
  $Host.UI.RawUI.SetBufferContents($point, $buffer);
}
function DrawText($x, $y, $message){
  $point.x = $x; $point.y = $y;
  $Host.UI.RawUI.CursorPosition = $point;
  Write-Host $message;
}

function SelectNewBlock(){
  $script:currentBlock = $nextBlock;
  $script:currentBlockRotation = $nextBlockRotation;
  $script:currentBlockColor = $nextBlockColor;
  $index = random(7);
  $script:nextBlock = $blocks[$index];
  $script:nextBlockRotation = random(4);
  $script:nextBlockColor = random($blockColors.Length);
  $nextBlockBuffer = $Host.UI.RawUI.NewBufferCellArray(@("    ","    ","    ","    "),[System.ConsoleColor]::Green,$bgc);
  0..3 | %{$char = $nextBlock[$nextBlockRotation][$_];$nextBlockBuffer[$char[1], $char[0]] = $Host.UI.RawUI.NewBufferCellArray(@($blockChar),$blockColors[$nextBlockColor],$bgc)[0,0];}
  $script:nextBlockBuffer = $nextBlockBuffer;

  $script:currentBlockX = $blockX + $blockW/2 -2; $script:currentBlockY = $blockY
  
  $script:currentRunFrameBuffer = $Host.UI.RawUI.GetBufferContents($blockFrame);
  DrawStaticInfo;
}

#
# Prepare invironment variables
#
function InitEnvironment(){
  cls;
  $script:totalScore = 0;
  # init framework
  $framework.Left = $framework.Top = 0;
  $framework.Right =  $framework.Left + $winSize.Width;
  $framework.Bottom = $framework.Top + $winSize.Height;
  # build border
  [String[]]$border = @();
  $line1 = "|"; $line2 = "\";
  1..$blockW | %{ $line1 += " "; $line2 += "="; }
  $line1 += "|"; $line2 += "/";
  1..$blockH | %{ $border += $line1; }
  $border += $line2;
  $script:border = $Host.UI.RawUI.NewBufferCellArray($border,[system.consolecolor]::Green,$script:bgc);
  Draw $blockX $blockY $script:border;
  $script:blockFrame.Left = $blockX; $script:blockFrame.Top = $blockY; $script:blockFrame.Right = $blockX + $blockW; $script:blockFrame.Bottom = $blockY + $blockH;
  #init blocks
  [Int32[][][][]]$blocks = @(
    @(((1,0),(1,1),(1,2),(1,3)), ((0,1),(1,1),(2,1),(3,1)), ((1,0),(1,1),(1,2),(1,3)), ((0,1),(1,1),(2,1),(3,1))),
    @(((1,1),(1,2),(2,1),(2,2)), ((1,1),(1,2),(2,1),(2,2)), ((1,1),(1,2),(2,1),(2,2)), ((1,1),(1,2),(2,1),(2,2))),
    @(((1,0),(1,1),(1,2),(2,1)), ((1,0),(0,1),(1,1),(2,1)), ((1,0),(0,1),(1,1),(1,2)), ((0,1),(1,1),(2,1),(1,2))),
    @(((1,0),(1,1),(2,1),(2,2)), ((1,1),(2,1),(0,2),(1,2)), ((1,0),(1,1),(2,1),(2,2)), ((1,1),(2,1),(0,2),(1,2))),
    @(((2,0),(1,1),(2,1),(1,2)), ((0,1),(1,1),(1,2),(2,2)), ((2,0),(1,1),(2,1),(1,2)), ((0,1),(1,1),(1,2),(2,2))),
    @(((1,0),(2,0),(1,1),(1,2)), ((0,0),(0,1),(1,1),(2,1)), ((1,0),(1,1),(0,2),(1,2)), ((0,1),(1,1),(2,1),(2,2))),
    @(((0,0),(1,0),(1,1),(1,2)), ((0,1),(1,1),(2,1),(0,2)), ((1,0),(1,1),(1,2),(2,2)), ((2,0),(0,1),(1,1),(2,1)))
    );
  $script:blocks = $blocks;
  #init current and next block;
  SelectNewBlock;
  SelectNewBlock;
}



function StartGame(){
  DrawStaticInfo;
  MoveBlock;
}

function DrawStaticInfo(){
  #Draw $blockX $blockY $currentRunFrameBuffer;
  DrawText $nextBlockX $nextBlockY ("Total Score:" + $totalScore);
  DrawText $nextBlockX ($nextBlockY + 1) "Next Block:";
  Draw ($nextBlockX + 2) ($nextBlockY + 2) $nextBlockBuffer;
}

function CheckAndDrawCurrentBlock(){
  $isStuck = $false;

  $buffer = $currentRunFrameBuffer.Clone();
  0..3 | %{
    $x = $currentBlockX + $currentBlock[$currentBlockRotation][$_][0] - $blockX; $y = $currentBlockY + $currentBlock[$currentBlockRotation][$_][1] - $blockY;
    $bufferCell = $buffer[$y, $x];
    if( $bufferCell.Character -ne " " ) { $isStuck = $true; }
    else { $bufferCell.Character = $blockChar; $bufferCell.ForegroundColor = $blockColors[$currentBlockColor]; $buffer[$y, $x] = $bufferCell; }
  };
  if ($isStuck -eq $true) {
    return $false;
  } else {
    Draw $blockX $blockY $buffer
    return $true;
  }
}

#
# Remove full lines
#
function ClearBlocks(){
  $buffer = $Host.UI.RawUI.GetBufferContents($blockFrame);
  $x = $blockFrame.Left; $y = $blockFrame.Top;
  #$blockW;$blockH;
  $lastLine = "";
  [Int32[]]$lines = @();
  foreach($i in $blockH..0){
    $isPassed = $true;
    foreach($j in 1..$blockW){
      if($buffer[$i,$j].Character -ne $blockChar) { $isPassed = $false; }
    }
    if($isPassed){
      $lines += $i;
    }
  }
  if($lines.Length -gt 0){
    # Blink the lines
    0..3 | %{
      foreach($i in $lines){
        foreach($j in 1..$blockW){
          $bufferCell = $buffer[$i, $j];
          $bufferCell.Character = "*";
          $buffer[$i, $j] = $bufferCell;
        }
      }
      Draw $x $y $buffer;
      Start-Sleep -m 100;
      foreach($i in $lines){
        foreach($j in 1..$blockW){
          $bufferCell = $buffer[$i, $j];
          $bufferCell.Character = "X";
          $buffer[$i, $j] = $bufferCell;
        }
      }
      Draw $x $y $buffer;
      Start-Sleep -m 100;
    }
    #Clear the lines
    $sourceLine = $lines[0];
    for($k = $sourceLine; $k -gt 0; $k--){
      if($sourceLine -gt 0){
        $sourceLine--;
      }
      while($lines -Contains $sourceLine){
        if($sourceLine -gt 0){
          $sourceLine--;
        }
      }
      foreach($l in 1..$blockW){
        $bufferCell = $buffer[$k, $l];
        $bufferCell.Character = $buffer[$sourceLine, $l].Character;
        $buffer[$k, $l] = $bufferCell;
      }
    }
    Draw $x $y $buffer;
    $script:totalScore += 100 * [Math]::Pow(2, $lines.Length);
  }
}




function KeyToCommand(){
  $code = 0;
      #$Host.UI.RawUI.FlushInputBuffer();
      #Start-Sleep -milliseconds 50;
  if ($Host.UI.RawUi.KeyAvailable){ 
    $key = $Host.UI.RawUI.ReadKey("NoEcho, IncludeKeyUp");
    $code = switch($key.VirtualKeyCode){
      81 { -1 } # ‘q’ quit the game
      32 { 32 } # map space to down arrow
      {(37..40) -contains $_ } {$key.VirtualKeyCode} # arrow key
      default { 0 } # do nothing
    };
  }
  return $code;
}

function Rotate($tempBlock){
  $tempBlock
  0..3 | %{
    $y = $tempBlock[$_][0] - 1; $x = $tempBlock[$_][1] - 1;
    $x = $x -BXOR $y; $y = $x -BXOR $y; $x = $x -BXOR $y;
    if(((1 - $y) -lt 0) -or (($x + 1) -lt 0)) {exit; 1 - $y; $x + 1;}
    $tempBlock[$_][0] = 1 - $y; $tempBlock[$_][1] = $x + 1
    };

  return $tempBlock;
}

function MoveBlock(){
  #$leftKey = 37; $upKey = 38; $rightKey = 39; $downKey = 40;
  $code = KeyToCommand;
  $startTime=Get-Date
  while($code -ne -1){
    do{
      $isDown = $false;
      $code = KeyToCommand;
      $x = $currentBlockX;
      $lastBlockRotation = $currentBlockRotation;
      switch($code){
        37 { $script:currentBlockX--; } #<=
        38 { $script:currentBlockRotation = ($currentBlockRotation + 1) % 4; } #rotate
        39 { $script:currentBlockX++; } #=>
        40 { $isDown = $true;} #strait down
        32 { $isDown = $true;
          $result = CheckAndDrawCurrentBlock;
          $y = $currentBlockY;
          while($result){
            $y = $script:currentBlockY++;
            $result = CheckAndDrawCurrentBlock;
            }
          $script:currentBlockY = $y;
          }
        default {}
      }

      $result = CheckAndDrawCurrentBlock;
      if($result -ne $true){
        $script:currentBlockX = $x;
        $script:currentBlockRotation = $lastBlockRotation;
      }
      $elapsed=((Get-Date).Subtract($startTime)).TotalMilliseconds;
      if($isDown -OR (($isDown -eq $false) -AND ($elapsed -ge $turndelay))){
        $isDown = $true; $script:currentBlockY++; $startTime=Get-Date;
        $result = CheckAndDrawCurrentBlock;
        if($result -ne $true){
          ClearBlocks;
          SelectNewBlock;
          $result = CheckAndDrawCurrentBlock;
          if($result -ne $true) {
            break;
          }
        }
      }

      Start-Sleep -m 10
    } until($code -eq -1)

    InitEnvironment;
    #CheckAndDrawCurrentBlock;

  }   # end of main loop
  #exit 1;
  return;
}

. main
$ErrorActionPreference = 'Stop'
$taskRoot = 'D:\PROJECTS\Amazon-Alexa-PaperClaw-2026'
$speaker = New-Object -ComObject SAPI.SpVoice
$voice = $speaker.GetVoices() | Where-Object { $_.GetDescription() -match 'Zira|David' } | Select-Object -First 1
if ($voice) { $speaker.Voice = $voice }
$speaker.Rate = -1
$stream = New-Object -ComObject SAPI.SpFileStream
$stream.Open((Join-Path $taskRoot 'evidence\narration.wav'), 3, $false)
$speaker.AudioOutputStream = $stream
$text = [System.IO.File]::ReadAllText((Join-Path $taskRoot 'docs\NARRATION.txt'))
[void]$speaker.Speak($text)
$stream.Close()
Write-Output 'English narration saved on D:.'
$audioDirectory = Join-Path $taskRoot 'evidence\voice'
[void][System.IO.Directory]::CreateDirectory($audioDirectory)
$paragraphs = [System.IO.File]::ReadAllLines((Join-Path $taskRoot 'docs\NARRATION.txt'))
$index = 0
foreach ($paragraph in $paragraphs) {
    if (-not $paragraph.Trim()) { continue }
    $segment = New-Object -ComObject SAPI.SpFileStream
    $segment.Open((Join-Path $audioDirectory ('{0:D2}.wav' -f $index)), 3, $false)
    $speaker.AudioOutputStream = $segment
    [void]$speaker.Speak($paragraph)
    $segment.Close()
    $index++
}
Write-Output ('Narration segments: ' + $index)

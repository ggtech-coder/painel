
$pc = $env:COMPUTERNAME
$user = $env:USERNAME

$cpu = (Get-WmiObject Win32_Processor).Name
$ram = [math]::Round((Get-WmiObject Win32_ComputerSystem).TotalPhysicalMemory /1GB)

$data = @{
    computador = $pc
    usuario = $user
    cpu = $cpu
    ram = "$ram GB"
}

$data | ConvertTo-Json

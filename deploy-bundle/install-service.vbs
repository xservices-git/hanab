' ============================================================
'  VAY365 - Silent Service Installer (NSSM-based)
' ============================================================
Option Explicit

Dim shell, fso, cwd, nssmPath, nssmDir, nssmExe
Set shell = CreateObject("WScript.Shell")
Set fso   = CreateObject("Scripting.FileSystemObject")

cwd = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
If Right(cwd, 1) = "\" Then cwd = Left(cwd, Len(cwd) - 1)

nssmDir = cwd & "tools\nssm"
nssmExe = nssmDir & "\win64\nssm.exe"
If Not fso.FileExists(nssmExe) Then
    WScript.Echo "[1/3] Dang tai NSSM..."
    shell.Run "cmd /c powershell -NoProfile -ExecutionPolicy Bypass -File """ & cwd & "install-nssm.ps1""", 0, True
End If
If Not fso.FileExists(nssmExe) Then
    WScript.Echo "[LOI] Khong tim thay NSSM. Hay chay install-nssm.ps1 thu cong."
    WScript.Quit 1
End If

WScript.Echo "[2/3] Dang tao Windows Service 'VAY365Web'..."
shell.Run "cmd /c """ & nssmExe & """ install VAY365Web """ & cwd & "node.exe"" """ & cwd & "apps\web\server.js""", 0, True
shell.Run "cmd /c """ & nssmExe & """ set VAY365Web AppDirectory """ & cwd & """", 0, True
shell.Run "cmd /c """ & nssmExe & """ set VAY365Web AppStdout """ & cwd & "logs\service.out.log""", 0, True
shell.Run "cmd /c """ & nssmExe & """ set VAY365Web AppStderr """ & cwd & "logs\service.err.log""", 0, True
shell.Run "cmd /c """ & nssmExe & """ set VAY365Web AppRotateFiles 1", 0, True
shell.Run "cmd /c """ & nssmExe & """ set VAY365Web AppRotateBytes 10485760", 0, True
shell.Run "cmd /c """ & nssmExe & """ set VAY365Web AppEnvironmentExtra NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000", 0, True
shell.Run "cmd /c """ & nssmExe & """ set VAY365Web Start SERVICE_AUTO_START", 0, True
shell.Run "cmd /c """ & nssmExe & """ set VAY365Web AppRestartDelay 5000", 0, True
shell.Run "cmd /c """ & nssmExe & """ set VAY365Web AppExit Default Restart", 0, True

WScript.Echo "[3/3] Dang khoi dong service..."
shell.Run "cmd /c net start VAY365Web", 0, True

WScript.Echo ""
WScript.Echo "============================================================"
WScript.Echo "  XONG! VAY365 dang chay nhu Windows Service."
WScript.Echo ""
WScript.Echo "  Quan ly:"
WScript.Echo "    uninstall-service.bat            <- go service"
WScript.Echo "    tools\nssm\win64\nssm.exe start VAY365Web"
WScript.Echo "    tools\nssm\win64\nssm.exe stop VAY365Web"
WScript.Echo "    tools\nssm\win64\nssm.exe restart VAY365Web"
WScript.Echo ""
WScript.Echo "  Logs:"
WScript.Echo "    logs\service.out.log"
WScript.Echo "    logs\service.err.log"
WScript.Echo "============================================================"
WScript.Echo ""
WScript.Echo "  Bam Enter de mo trinh duyet..."
WScript.StdIn.ReadLine
shell.Run "http://localhost:3000"

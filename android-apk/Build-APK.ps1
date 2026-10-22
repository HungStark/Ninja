param([ValidateSet('Debug','Release')][string]$Variant='Debug',[switch]$Offline)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$nodeCommand=Get-Command node -ErrorAction SilentlyContinue
if(-not $env:NODE_BINARY){
    if($nodeCommand){$env:NODE_BINARY=$nodeCommand.Source}
    else {$env:NODE_BINARY=Join-Path $projectRoot '.tools\node-v24.21.0-win-x64\node.exe'}
}
if(-not(Test-Path -LiteralPath $env:NODE_BINARY)){throw 'Install Node.js 20+ or set NODE_BINARY.'}
if(-not $env:JAVA_HOME){
    $studioJava=Join-Path $env:ProgramFiles 'Android\Android Studio\jbr'
    if(Test-Path -LiteralPath ($studioJava+'\bin\java.exe')){$env:JAVA_HOME=$studioJava}
    else {throw 'Set JAVA_HOME to a JDK 17 or newer (Android Studio jbr works).'}
}
$sdkPath=$env:ANDROID_HOME
if(-not $sdkPath){$sdkPath=$env:ANDROID_SDK_ROOT}
if(-not $sdkPath){$sdkPath=Join-Path $env:LOCALAPPDATA 'Android\Sdk'}
if(-not(Test-Path -LiteralPath ($sdkPath+'\platforms\android-34\android.jar'))){throw 'Install Android SDK Platform 34 and Build-Tools 34.0.0 in Android Studio.'}
('sdk.dir='+$sdkPath.Replace('\','/')) | Set-Content -Encoding ascii (Join-Path $PSScriptRoot 'local.properties')
$localKeys=Join-Path $PSScriptRoot '.local'
New-Item -ItemType Directory -Path $localKeys -Force | Out-Null
$debugKey=Join-Path $localKeys 'debug.keystore'
if(-not(Test-Path -LiteralPath $debugKey)){
    & ($env:JAVA_HOME+'\bin\keytool.exe') -genkeypair -keystore $debugKey -storepass android -keypass android -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Android Debug,O=Android,C=US'
    if($LASTEXITCODE -ne 0){throw 'Cannot generate local debug signing key.'}
}
if(-not $env:GRADLE_USER_HOME){$env:GRADLE_USER_HOME=Join-Path $projectRoot '.tools\android-gradle-home'}
$env:ANDROID_USER_HOME=Join-Path $projectRoot '.tools\android-user'
$env:DEBUG=''
$localGradle=Join-Path $projectRoot '.tools\gradle-8.14\bin\gradle.bat'
$gradleCommand=if(Test-Path -LiteralPath $localGradle){$localGradle}else{Join-Path $PSScriptRoot 'gradlew.bat'}
$gradleArgs=@('-p',$PSScriptRoot,('assemble'+$Variant),'--no-daemon','--console=plain')
if($Offline){$gradleArgs+='--offline'}
& $gradleCommand @gradleArgs
if($LASTEXITCODE -ne 0){throw 'APK build failed. See Gradle output above.'}
$flavor=$Variant.ToLowerInvariant()
$apkName=if($Variant -eq 'Debug'){'app-debug.apk'}else{'app-release-unsigned.apk'}
$apk=Join-Path $PSScriptRoot ('app\build\outputs\apk\'+$flavor+'\'+$apkName)
$outputDir=Join-Path $PSScriptRoot 'out'
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
$outputName=if($Variant -eq 'Debug'){'AnHoa-debug.apk'}else{'AnHoa-release-unsigned.apk'}
Copy-Item -LiteralPath $apk -Destination (Join-Path $outputDir $outputName) -Force
Write-Output ('APK ready: '+(Join-Path $outputDir $outputName))

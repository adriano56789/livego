!include MUI2.nsh
!include x64.nsh

; Nome do aplicativo
Name "LiveGo"
OutFile "..\LiveGo-Setup.exe"

; Diretório de instalação padrão
InstallDir "$PROGRAMFILES64\LiveGo"

; Páginas do instalador
!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao Assistente de Instalação do LiveGo"
!define MUI_WELCOMEPAGE_TEXT "Este assistente irá guiá-lo na instalação do LiveGo.\r\n\r\nClique em Avançar para continuar."
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Páginas de desinstalação
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Idiomas
!insertmacro MUI_LANGUAGE "PortugueseBR"

; Seção principal de instalação
Section "LiveGo" SecMain
  SetOutPath "$INSTDIR"
  
  ; Arquivos do aplicativo
  File /r "..\release\win-unpacked\*.*"
  
  ; Criar atalhos
  CreateDirectory "$SMPROGRAMS\LiveGo"
  CreateShortCut "$SMPROGRAMS\LiveGo\LiveGo.lnk" "$INSTDIR\LiveGo.exe"
  CreateShortCut "$SMPROGRAMS\LiveGo\Desinstalar.lnk" "$INSTDIR\Uninstall LiveGo.exe"
  CreateShortCut "$DESKTOP\LiveGo.lnk" "$INSTDIR\LiveGo.exe"
  
  ; Registrar desinstalador
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Adicionar/Remover Programas
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LiveGo" \
                 "DisplayName" "LiveGo"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LiveGo" \
                 "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LiveGo" \
                 "DisplayVersion" "1.0.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LiveGo" \
                 "Publisher" "LiveGo"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LiveGo" \
                   "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LiveGo" \
                   "NoRepair" 1
SectionEnd

; Seção de desinstalação
Section "Uninstall"
  ; Remover arquivos
  RMDir /r "$INSTDIR"
  
  ; Remover atalhos
  Delete "$SMPROGRAMS\LiveGo\LiveGo.lnk"
  Delete "$SMPROGRAMS\LiveGo\Desinstalar.lnk"
  RMDir "$SMPROGRAMS\LiveGo"
  Delete "$DESKTOP\LiveGo.lnk"
  
  ; Remover do registro
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LiveGo"
SectionEnd

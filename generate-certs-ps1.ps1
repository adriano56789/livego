# Script PowerShell para gerar certificados auto-assinados para TURN server
Write-Host "Gerando certificados auto-assinados para TURN server usando PowerShell..."

# Criar certificado auto-assinado
$cert = New-SelfSignedCertificate -DnsName "livego.store" -CertStoreLocation "cert:\LocalMachine\My" -KeyUsage KeyEncipherment, DigitalSignature -Type Custom -NotAfter (Get-Date).AddYears(1)

# Exportar chave privada
$privateKeyPath = "C:\Users\adria\OneDrive\Documentos\Área de Trabalho\livego\turn_server_pkey.pem"
Export-PfxCertificate -Cert $cert -FilePath "$privateKeyPath.pfx" -Password (ConvertTo-SecureString -String "livego123" -Force -AsPlainText)

# Exportar certificado
$certPath = "C:\Users\adria\OneDrive\Documentos\Área de Trabalho\livego\turn_server_cert.pem"
$cert | Export-Certificate -FilePath $certPath -Type CERT

# Converter PFX para PEM (se OpenSSL estiver disponível no futuro)
Write-Host "Certificado gerado: $certPath"
Write-Host "Chave privada exportada: $privateKeyPath.pfx"
Write-Host ""
Write-Host "Para converter .pfx para .pem, use:"
Write-Host "openssl pkcs12 -in turn_server_pkey.pem.pfx -out turn_server_pkey.pem -nodes -passin pass:livego123"
Write-Host ""
Write-Host "Certificados criados com sucesso!"

import subprocess, json

cmd = [
    "curl.exe", "-s",
    "-u", "daniel.anunciacao@claro.com.br:***REMOVIDO***",
    "https://clarobr.atlassian.net/rest/agile/1.0/board/2734/issue?maxResults=250&fields=summary,status"
]

result = subprocess.run(cmd, capture_output=True)
stdout = result.stdout.decode('utf-8', errors='replace')
data = json.loads(stdout)

print("=== TODAS AS INICIATIVAS ===")
for i in data['issues']:
    print(f'{i["key"]}: "{i["fields"]["summary"]}" ({i["fields"]["status"]["name"]})')

print("\n=== BUSCANDO ALVOS ===")
alvos = ['ARI', 'Juridico', 'SPAM', 'Spam', 'Editais', 'Automação']
for alvo in alvos:
    for i in data['issues']:
        if alvo.lower() in i['fields']['summary'].lower():
            print(f'  "{alvo}" -> "{i["fields"]["summary"]}" ({i["key"]})')
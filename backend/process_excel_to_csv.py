import pandas as pd

# Caminho do arquivo Excel
excel_path = 'Status_Iniciativas beOn Labs v2.0.xlsx'
# Nome da planilha a ser trabalhada
sheet_name = 'Planilha1'
# Nome do arquivo CSV de saída
csv_path = 'planilha1.csv'

# Lê a planilha específica
df = pd.read_excel(excel_path, sheet_name=sheet_name)

# Filtra apenas as linhas que possuem valor na coluna 'ideia/problema /oportunidade'
col_ideia = [col for col in df.columns if 'ideia' in col.lower()][0]

# Mantém apenas as linhas que possuem algum status relevante
status_validos = [
    'backlog', 'concluido', 'em backlog', 'em prospecção', 'não iniciado', 'parado'
]

df_filtrado = df[df[col_ideia].notnull()]


# Filtra experimentos 'Em andamento' na coluna 'Experimentação'
col_experimentacao = [col for col in df.columns if 'experimenta' in col.lower()][0]
df_em_andamento = df_filtrado[df_filtrado[col_experimentacao].str.strip().str.lower() == 'em andamento']

# Salva como CSV geral
df_filtrado.to_csv(csv_path, index=False)
# Salva como CSV apenas 'Em andamento'
csv_andamento_path = 'experimentos_em_andamento.csv'
df_em_andamento.to_csv(csv_andamento_path, index=False)

print(f'Arquivo CSV geral gerado: {csv_path}')
print(f'Total de experimentos: {len(df_filtrado)}')
print(f'Arquivo CSV de experimentos em andamento gerado: {csv_andamento_path}')
print(f'Total de experimentos em andamento: {len(df_em_andamento)}')

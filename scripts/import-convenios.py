#!/usr/bin/env python3
"""
Script de importação de convênios para o PainelAdminVaccini
Importa dados dos CSVs para o Supabase
"""

import os
import csv
import pandas as pd
from supabase import create_client, Client
from typing import Dict, List, Optional
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ConvenioImporter:
    def __init__(self):
        # Configuração do Supabase
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("❌ Variáveis de ambiente do Supabase não encontradas!")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        # Mapeamentos
        self.convenio_mapping = {
            'AMIL': 'AMIL',
            'BNDES': 'BNDES',
            'BRADESCO CONCIERGE': 'BRADESCO CONCIERGE',
            'BRADESCO AVON / NATURA': 'BRADESCO AVON / NATURA',
            'CAMARJ': 'CAMARJ',
            'CAMPERJ': 'CAMPERJ',
            'CAREPLUS': 'CAREPLUS',
            'FIPECQ': 'FIPECQ',
            'FUNCIONAL': 'FUNCIONAL',
            'HAPVIDA/NOTREDAME': 'HAPVIDA/NOTREDAME',
            'OMINT': 'OMINT',
            'FUNDAÇÃO REAL GRANDEZA': 'FUNDAÇÃO REAL GRANDEZA',
            'FUNDAÇÃO REAL GRANDEZA (SALVUS SALUTEM)': 'FUNDAÇÃO REAL GRANDEZA (SALVUS SALUTEM)',
            'HUMANIA': 'HUMANIA',
            'SULAMÉRICA EXECUTIVO': 'SULAMÉRICA EXECUTIVO',
            'SULAMÉRICA PRESTIGE': 'SULAMÉRICA PRESTIGE',
            'SULAMERICA ESPECIAL S/A': 'SULAMERICA ESPECIAL S/A',
            'UNAFISCO': 'UNAFISCO',
            'VIDALINK': 'VIDALINK'
        }
        
        self.unidade_mapping = {
            # Mapeamento baseado nas unidades reais do sistema
            'LARGO': 'Vaccini Largo do Machardo',           # ID 21
            'REDE': 'Vaccini Tijuca Central',               # ID 26 (Tijuca Central - Rede)
            'BOTAFOGO': 'Vaccini Botafogo',                 # ID 19
            'COPA': 'Vaccini Copacabana',                   # ID 20
            'TIJ 45': 'Vaccini Tijuca 45',                  # ID 24
            'BARRA AMERICAS': 'Vaccini Barra Américas',     # ID 18
            'N. IGUACU': 'Vaccini Nova Iguaçu',             # ID 22
            'NOVA IGUACU': 'Vaccini Nova Iguaçu',           # ID 22 (variação)
            'NOVA IGUACÚ': 'Vaccini Nova Iguaçu',           # ID 22 (com acento)
            'BARRA AMÉRICAS': 'Vaccini Barra Américas',     # ID 18 (com acento)
            'TIJUCA 45': 'Vaccini Tijuca 45',               # ID 24 (variação)
            'TIJUCA CENTRAL': 'Vaccini Tijuca Central',     # ID 26
            'LARGO DO MACHADO': 'Vaccini Largo do Machardo', # ID 21 (nome completo)
            'COPACABANA': 'Vaccini Copacabana',             # ID 20 (nome completo)
            'BOTAFOGO': 'Vaccini Botafogo',                 # ID 19 (nome completo)
            'BARRA DA TIJUCA': 'Vaccini Barra Américas',    # ID 18 (bairro)
            'AMÉRICAS': 'Vaccini Barra Américas',           # ID 18 (nome interno)
            'MACHADO': 'Vaccini Largo do Machardo',         # ID 21 (abreviação)
            'TIJUCA': 'Vaccini Tijuca Central'              # ID 26 (padrão para Tijuca)
        }

    def normalize_name(self, name: str) -> str:
        """Normaliza nome removendo espaços extras e convertendo para maiúscula"""
        return name.strip().upper()

    def map_convenio_name(self, csv_name: str) -> str:
        """Mapeia nome do convênio do CSV para nome consistente"""
        normalized = self.normalize_name(csv_name)
        return self.convenio_mapping.get(normalized, normalized)

    def map_unidade_name(self, csv_name: str) -> str:
        """Mapeia nome da unidade do CSV para nome consistente"""
        normalized = self.normalize_name(csv_name)
        return self.unidade_mapping.get(normalized, csv_name.strip())

    async def get_vaccine_id(self, vaccine_name: str) -> Optional[int]:
        """Busca ID da vacina na tabela ref_vacinas"""
        try:
            result = self.supabase.table('ref_vacinas')\
                .select('ref_vacinasID')\
                .ilike('nome', f'%{vaccine_name.strip()}%')\
                .limit(1)\
                .execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]['ref_vacinasID']
            else:
                logger.warning(f"⚠️  Vacina não encontrada: {vaccine_name}")
                return None
        except Exception as e:
            logger.error(f"❌ Erro ao buscar vacina {vaccine_name}: {e}")
            return None

    async def get_unidade_id(self, unidade_name: str) -> Optional[int]:
        """Busca ID da unidade na tabela unidade"""
        try:
            # Primeiro tenta busca exata
            result = self.supabase.table('unidade')\
                .select('id, nome')\
                .eq('nome', unidade_name)\
                .limit(1)\
                .execute()
            
            # Se não encontrou, tenta busca por similaridade
            if not result.data or len(result.data) == 0:
                result = self.supabase.table('unidade')\
                    .select('id, nome')\
                    .ilike('nome', f'%{unidade_name}%')\
                    .limit(1)\
                    .execute()
                
                if result.data and len(result.data) > 0:
                    logger.info(f"🔍 Unidade encontrada por similaridade: {unidade_name} → {result.data[0]['nome']}")
            
            if result.data and len(result.data) > 0:
                return result.data[0]['id']
            else:
                logger.warning(f"⚠️  Unidade não encontrada: {unidade_name}")
                return None
        except Exception as e:
            logger.error(f"❌ Erro ao buscar unidade {unidade_name}: {e}")
            return None

    async def import_convenios(self):
        """Função principal de importação"""
        try:
            logger.info("🚀 Iniciando importação de convênios...\n")

            # 1. Ler CSVs
            logger.info("📋 Lendo arquivos CSV...")
            precos_df = pd.read_csv('convenios_precos.csv')
            unidades_df = pd.read_csv('convenios_unidades.csv')
            
            logger.info(f"   • {len(precos_df)} registros de preços")
            logger.info(f"   • {len(unidades_df)} registros de unidades")

            # 2. Importar convênios únicos
            logger.info("\n📋 Passo 1: Importando convênios...")
            
            convenios_precos = set(precos_df['Convenio'].apply(self.map_convenio_name))
            convenios_unidades = set(unidades_df['Convênios'].apply(self.map_convenio_name))
            convenios_unicos = convenios_precos.union(convenios_unidades)
            
            convenios_to_insert = [{'nome': nome, 'ativo': True} for nome in convenios_unicos]
            
            result = self.supabase.table('convenios').upsert(
                convenios_to_insert, 
                on_conflict='nome'
            ).execute()
            
            logger.info(f"✅ {len(result.data)} convênios importados/atualizados")

            # 3. Importar preços das vacinas
            logger.info("\n💰 Passo 2: Importando preços das vacinas...")
            precos_inseridos = 0
            precos_ignorados = 0

            for _, row in precos_df.iterrows():
                convenio_nome = self.map_convenio_name(row['Convenio'])
                vacina_nome = row['VACINAS']
                preco = float(row['Preco']) if pd.notna(row['Preco']) else 0.0

                # Buscar ID do convênio
                convenio = next((c for c in result.data if c['nome'] == convenio_nome), None)
                if not convenio:
                    logger.warning(f"⚠️  Convênio não encontrado: {convenio_nome}")
                    continue

                # Buscar ID da vacina
                vacina_id = await self.get_vaccine_id(vacina_nome)
                if not vacina_id:
                    precos_ignorados += 1
                    continue

                # Inserir preço
                try:
                    self.supabase.table('convenio_vacina_precos').upsert({
                        'convenio_id': convenio['id'],
                        'vacina_id': vacina_id,
                        'preco': preco,
                        'ativo': True
                    }, on_conflict='convenio_id,vacina_id').execute()
                    precos_inseridos += 1
                except Exception as e:
                    logger.error(f"❌ Erro ao inserir preço para {vacina_nome} - {convenio_nome}: {e}")

            logger.info(f"✅ {precos_inseridos} preços importados/atualizados")
            logger.info(f"⚠️  {precos_ignorados} preços ignorados (vacina não encontrada)")

            # 4. Importar convênios por unidade
            logger.info("\n🏥 Passo 3: Importando convênios por unidade...")
            unidades_inseridas = 0
            unidades_ignoradas = 0

            for _, row in unidades_df.iterrows():
                convenio_nome = self.map_convenio_name(row['Convênios'])
                unidade_nome = self.map_unidade_name(row['Unidade'])
                aceita = row['Aceita'] == 'SIM'

                # Buscar ID do convênio
                convenio = next((c for c in result.data if c['nome'] == convenio_nome), None)
                if not convenio:
                    logger.warning(f"⚠️  Convênio não encontrado: {convenio_nome}")
                    continue

                # Buscar ID da unidade
                unidade_id = await self.get_unidade_id(unidade_nome)
                if not unidade_id:
                    unidades_ignoradas += 1
                    continue

                # Inserir relação unidade-convênio
                try:
                    self.supabase.table('unidade_convenios').upsert({
                        'unidade_id': unidade_id,
                        'convenio_id': convenio['id'],
                        'aceita': aceita
                    }, on_conflict='unidade_id,convenio_id').execute()
                    unidades_inseridas += 1
                except Exception as e:
                    logger.error(f"❌ Erro ao inserir relação unidade-convênio: {e}")

            logger.info(f"✅ {unidades_inseridas} relações unidade-convênio importadas/atualizadas")
            logger.info(f"⚠️  {unidades_ignoradas} relações ignoradas (unidade não encontrada)")

            # 5. Resumo final
            logger.info("\n📊 Resumo da Importação:")
            logger.info(f"   • Convênios: {len(result.data)}")
            logger.info(f"   • Preços de vacinas: {precos_inseridos}")
            logger.info(f"   • Relações unidade-convênio: {unidades_inseridas}")
            logger.info("\n🎉 Importação concluída com sucesso!")

        except Exception as e:
            logger.error(f"❌ Erro durante a importação: {e}")
            raise

async def main():
    """Função principal"""
    importer = ConvenioImporter()
    await importer.import_convenios()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

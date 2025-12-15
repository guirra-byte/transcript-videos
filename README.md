<img width="1232" height="411" alt="image" src="https://github.com/user-attachments/assets/02583527-3137-43ef-876d-4554b645d2a4" />

# Transcrição de Vídeos
Este repositório contém o código-fonte de uma aplicação backend para transcrição de vídeos, construída com foco em arquitetura orientada a eventos, processamento assíncrono e escalabilidade.

O sistema utiliza o Amazon S3 como ponto de ingestão de arquivos e reage a eventos de upload para iniciar o processamento, evitando acoplamento direto entre cliente e backend.

## O fluxo principal do sistema é event-driven:
1. O vídeo é enviado diretamente para um bucket no Amazon S3.
2. O S3 emite um evento de Object Created (PutObject).
3. O Amazon EventBridge captura esse evento.
4. O EventBridge encaminha os metadados do arquivo para o backend via HTTP.
5. O backend registra o upload e dispara o processamento de transcrição de forma assíncrona.

O backend não recebe o arquivo diretamente, apenas reage aos eventos, o que garante maior escalabilidade, menor latência e melhor separação de responsabilidades.

## 🚀 Funcionalidades
- [x] Upload de vídeos via Amazon S3 como ponto único de ingestão.
- [x] Notificação automática de uploads usando EventBridge.
- [x] Processamento concorrente de transcrições com Node.js Worker Threads e integração com API da OpenAI.
- [x] Comunicação assíncrona entre componentes usando RabbitMQ.
- [x] Arquitetura preparada para múltiplos uploads simultâneos sem sobrecarregar o backend.


## 🧩 Componentes da Aplicação

| Componente            | Responsabilidade Principal                                                                 | Observações Arquiteturais                                                                 |
|-----------------------|----------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| **Amazon S3**             | Ponto de ingestão dos vídeos enviados para o sistema                                         | Atua como fonte de verdade dos arquivos; backend não recebe upload direto                  |
| **Amazon EventBridge**    | Captura eventos de `PutObject` gerados pelo S3                                               | Encaminha apenas metadados do arquivo, evitando tráfego desnecessário                      |
| **Backend Node.js**       | Orquestra o fluxo de processamento a partir dos eventos recebidos                            | Backend reativo, orientado a eventos e desacoplado do upload                               |
| **RabbitMQ**              | Gerencia filas para processamento assíncrono                                                 | Absorve picos de carga e garante desacoplamento entre orquestração e processamento         |
| **Worker Threads**        | Executa tarefas pesadas de transcrição de forma concorrente                                  | Evita bloqueio da thread principal e melhora throughput                                    |
| **OpenAI API**         | Realiza a transcrição dos vídeos utilizando modelos de IA                                    | Chamadas externas isoladas em workers para evitar impacto no tempo de resposta da API      |



##
<p align="center">
    <img src="https://www.aikonbox.com.br/icons?i=javascript,nodejs,rabbitmq,docker,aws&t=40" />
</p>

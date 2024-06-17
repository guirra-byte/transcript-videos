## Transcrição de Vídeos
Este repositório contém o código-fonte de uma aplicação backend desenvolvida 
para transcrição de vídeos utilizando diversas tecnologias e serviços para escalabilidade e integração eficiente.

### Funcionalidades:
- [x] Transcrição de vídeos utilizando a API do Replicate.
- [x] Utilização de Node.js Worker Threads para multiplicar o poder de processamento.
- [x] Integração assíncrona entre sistemas utilizando RabbitMQ.
- [x] Armazenamento de arquivos após a transcrição em um ambiente local emulado com LocalStack, simulando o serviço S3 da AWS.
      
### Tecnologias Utilizadas:
- [x] Node.js: Plataforma de execução de código JavaScript no backend.
- [x] Worker Threads: Módulo do Node.js para execução de threads para processamento paralelo.
- [x] RabbitMQ: Serviço de mensageria para comunicação assíncrona entre microserviços.
- [x] LocalStack: Framework para emulação de serviços da AWS em ambientes locais, incluindo S3 que foi utilizado para armazenar os arquivos da transcrição.

pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/guruvardhan8374/AI-Ambulance-Dispatch.git'
            }
        }

        stage('Build Backend') {
            steps {
                sh 'docker build -t ai-ambulance-dispatch-backend ./backend'
            }
        }

        stage('Build Frontend') {
            steps {
                sh 'docker build -t ai-ambulance-dispatch-frontend ./frontend'
            }
        }

        stage('Stop Old Containers') {
            steps {
                sh 'docker stop ambulance-backend ambulance-frontend || true'
                sh 'docker rm ambulance-backend ambulance-frontend || true'
            }
        }

        stage('Run Backend') {
            steps {
                sh '''
                    docker run -d \
                    --name ambulance-backend \
                    -p 8000:8000 \
                    ai-ambulance-dispatch-backend:latest
                '''
            }
        }

        stage('Run Frontend') {
            steps {
                sh '''
                    docker run -d \
                    --name ambulance-frontend \
                    -p 3000:3000 \
                    ai-ambulance-dispatch-frontend:latest
                '''
            }
        }

        stage('Check Containers') {
            steps {
                sh 'docker ps'
            }
        }
    }
}

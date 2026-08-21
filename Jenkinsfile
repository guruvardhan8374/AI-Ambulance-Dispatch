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
                sh 'docker build -t ai-ambulance-dispatch-backend:latest ./backend'
            }
        }

        stage('Build Frontend') {
            steps {
                sh 'docker build -t ai-ambulance-dispatch-frontend:latest ./frontend'
            }
        }

        stage('Stop and Remove Old Containers') {
            steps {
                sh '''
                    docker stop ambulance_backend || true
                    docker rm ambulance_backend || true

                    docker stop ambulance_frontend || true
                    docker rm ambulance_frontend || true
                '''
            }
        }

        stage('Run Backend') {
            steps {
                sh '''
                    docker run -d \
                    --name ambulance_backend \
                    -p 8000:8000 \
                    ai-ambulance-dispatch-backend:latest
                '''
            }
        }

        stage('Run Frontend') {
            steps {
                sh '''
                    docker run -d \
                    --name ambulance_frontend \
                    -p 3000:80 \
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

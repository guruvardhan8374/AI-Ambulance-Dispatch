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

        stage('Create Network and Volume') {
            steps {
                sh '''
                    docker network create ambulance-network || true
                    docker volume create backend_data || true
                '''
            }
        }

        stage('Remove Old Containers') {
            steps {
                sh '''
                    docker rm -f ambulance_backend || true
                    docker rm -f ambulance_frontend || true
                '''
            }
        }

        stage('Run Backend') {
            steps {
                sh '''
                    docker run -d \
                    --name ambulance_backend \
                    --network ambulance-network \
                    --network-alias backend \
                    -v backend_data:/app/data \
                    ai-ambulance-dispatch-backend:latest
                '''
            }
        }

        stage('Run Frontend') {
            steps {
                sh '''
                    docker run -d \
                    --name ambulance_frontend \
                    --network ambulance-network \
                    -p 80:80 \
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

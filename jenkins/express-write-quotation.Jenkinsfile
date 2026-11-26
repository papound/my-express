pipeline {
    // Set this label to match your CT 114 agent node label in Jenkins (e.g. ci-runner)
    agent { label 'ci-runner' }

    parameters {
        text(
            name: 'PAYLOAD_JSON',
            defaultValue: '{"company":"WriteTes","cuscod":"ด-001","youref":"JENKINS TEST","items":[{"stkcod":"144535_12_L","ordqty":1}]}',
            description: 'JSON payload for C:\\Scripts\\express-write-qt.ps1 on WIN-SERVER'
        )
    }

    options {
        timeout(time: 2, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Write Quotation to Express (WriteTes)') {
            steps {
                script {
                    if (!params.PAYLOAD_JSON?.trim()) {
                        error('PAYLOAD_JSON is required')
                    }

                    withEnv(["PAYLOAD_RAW=${params.PAYLOAD_JSON}"]) {
                        def result = sh(
                            script: '''
                                B64=$(printf '%s' "$PAYLOAD_RAW" | base64 -w0)
                                ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new chanawatn@100.105.105.121 \
                                  powershell -NoProfile -ExecutionPolicy Bypass -File 'C:\\Scripts\\express-write-qt.ps1' -PayloadBase64 "$B64"
                            ''',
                            returnStdout: true
                        ).trim()

                        echo "EXPRESS_WRITE_RESULT=${result}"
                        if (!result.contains('"ok":true')) {
                            error("Express write failed: ${result}")
                        }
                    }
                }
            }
        }
    }
}

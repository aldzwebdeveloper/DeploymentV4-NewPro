// Vercel API Backend Handler
const vercelTokens = [
    "8C8mAncpmDBCEteoqUL08WO0",  // Token Account 1
    "iMZdXbdEerlvL8oYWphckb7B",  // Token Account 2  
    "gvxjCj2AcqdjUwURpaoXhPjd",  // Token Account 3
    "55pVAsQhXZ5Yqwo0VGI4W0Me", // Token Account 4
    "Vv5QDbKOmtHmlV4sjtodVAUc"  // Token Account 5
/*    "iAn8hLCPQrRuslbfKsqRwY7J", // Token 6
    "aR1VKAeeg4cLBWsfg7c8D5qF", // Token 7
    "MmnDq1TtxB2UdQ4LAjEhulyD", // Token 8
    "TCfi40hIA0pDrHdkYB6PpgqP", // Token 9
    "2WCuvNZforTv0vNmAWJFBNxo" // Token 10 */
];

let currentTokenIndex = 0;

// Function to get active token
function getActiveToken() {
    return vercelTokens[currentTokenIndex];
}

// Function to rotate token
function rotateToken() {
    currentTokenIndex = (currentTokenIndex + 1) % vercelTokens.length;
    return vercelTokens[currentTokenIndex];
}

// Main deployment handler
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { siteName, fileType } = req.body;
        
        if (fileType === 'html') {
            const { htmlContent, fileName } = req.body;
            // Process HTML file
            // ... existing HTML deployment logic
        } else if (req.files && req.files.zipFile) {
            // Process ZIP file
            const zipFile = req.files.zipFile;
            // Extract and deploy ZIP contents
            // ... ZIP deployment logic
        } else if (req.files && req.files.file) {
            // Process single file (JS, CSS, etc.)
            const file = req.files.file;
            const { fileContent, fileName } = req.body;
            // ... file deployment logic
        }
        
        if (!siteName || !fileType) {
            return res.status(400).json({ error: 'Site name and files content are required' });
        }

        // Get current token
        const token = getActiveToken();
        
        console.log(`Deploying ${siteName} with token ${currentTokenIndex + 1}`);

        // Step 1: Create project
        const projectResponse = await fetch("https://api.vercel.com/v9/projects", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: siteName })
        });

        if (!projectResponse.ok) {
            const error = await projectResponse.json();
            throw new Error(`Project creation failed: ${error.error?.message || 'Unknown error'}`);
        }

        // Step 2: Deploy
        const payload = {
            name: siteName,
            project: siteName,
            target: "production",
            files: [{ file: fileName, data: fileType }]
        };

        const deployResponse = await fetch("https://api.vercel.com/v13/deployments", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await deployResponse.json();

        if (data.url) {
            const websiteUrl = `https://${siteName}.vercel.app`;
            
            // Rotate token for next deployment
            rotateToken();
            
            return res.status(200).json({
                success: true,
                url: websiteUrl,
                tokenIndex: currentTokenIndex,
                message: 'Deployment successful'
            });
        } else {
            // Try with next token if current fails
            const nextToken = rotateToken();
            console.log(`Token ${currentTokenIndex} failed, trying token ${currentTokenIndex + 1}`);
            
            // Retry with next token
            const retryResponse = await fetch("https://api.vercel.com/v13/deployments", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${nextToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const retryData = await retryResponse.json();

            if (retryData.url) {
                const websiteUrl = `https://${siteName}.vercel.app`;
                return res.status(200).json({
                    success: true,
                    url: websiteUrl,
                    tokenIndex: currentTokenIndex,
                    message: 'Deployment successful with retry'
                });
            }

            return res.status(500).json({
                success: false,
                error: data.error?.message || 'Deployment failed'
            });
        }
    } catch (error) {
        console.error('Deployment error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}
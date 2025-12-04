# deploy_vps.sh
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv nginx git curl -y

# Install NVIDIA drivers + CUDA (if not already)
# sudo ubuntu-drivers autoinstall && sudo reboot

# Clone your code
git clone https://github.com/yourname/sql-chat-app.git
cd sql-chat-app/backend

# Setup Python
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Test model load (should work)
python manage.py check

# Run with Gunicorn (persistent)
gunicorn --workers 2 --bind 0.0.0.0:8000 sqlchat_api.wsgi:application

# In another terminal: build & serve React
cd ../frontend
npm install
npm run build
sudo npm install -g serve
serve -s build -l 3000
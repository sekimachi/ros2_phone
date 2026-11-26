
#!/bin/bash

source /opt/ros/humble/setup.bash
source ~/potato_ws/install/setup.bash

cd ~/ros2_phone || exit 1

ros2 launch rosbridge_server rosbridge_websocket_launch.xml &
ROS_PID=$!

python3 -m http.server 8000 --bind 0.0.0.0 &
WEB_PID=$!

if grep -qi microsoft /proc/sys/kernel/osrelease; then
  IP=$(powershell.exe -NoProfile -Command \
    "(Get-NetIPConfiguration | Where-Object { \$_.IPv4DefaultGateway -ne \$null } | Select-Object -First 1).IPv4Address.IPAddress" \
    | tr -d '\r')
else
  IP=$(hostname -I | awk '{print $1}')
fi

echo "ฅ^ΦωΦ^ฅ ───────────"
echo "サーバー起動しました"
echo "Web: http://${IP:-localhost}:8000"
echo "rosbridge: ws://${IP:-localhost}:9090"
echo "──────────┬────┬〜〜"

cleanup() {
  kill "$ROS_PID" "$WEB_PID" 2>/dev/null
}

trap cleanup EXIT INT TERM
wait

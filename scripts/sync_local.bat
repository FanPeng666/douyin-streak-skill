@echo off
cd /d "%~dp0.."
echo 正在从远程拉取最新代码...
git fetch origin
git reset --hard FETCH_HEAD
echo 同步完成
git log --oneline -3
pause

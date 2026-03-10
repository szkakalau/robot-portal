# Robot Portal

全栈 AI 机器人门户（Next.js 14 + FastAPI + Supabase + DeepSeek）

## 环境变量

项目根新建 `.env`（不要提交到 Git）：

```
DEEPSEEK_API_KEY=你的Key
DEEPSEEK_API_BASE=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_API_BASE=http://localhost:8000
SUPABASE_URL=
SUPABASE_KEY=
ALLOWED_ORIGINS=http://localhost:3000
```

## 本地开发

后端：

```
pip3 install -r robot-portal/backend/requirements.txt
uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload --app-dir robot-portal
```

自动化脚本：

```
python3 robot-portal/run.py
```

前端：

```
cd robot-portal/frontend
npm install
npm run dev
```

## 部署到 Render（后端）

1. 新建 Web Service，连接仓库
2. Build Command: `pip3 install -r robot-portal/backend/requirements.txt`
3. Start Command: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT --app-dir robot-portal`
4. 环境变量：
   - `DEEPSEEK_API_KEY`
   - `DEEPSEEK_API_BASE=https://api.deepseek.com`
   - `DEEPSEEK_MODEL=deepseek-chat`
   - `SUPABASE_URL`（可选）
   - `SUPABASE_KEY`（可选）
   - `ALLOWED_ORIGINS=https://你的vercel域名.vercel.app`
5. 验证：访问 `/health` 返回 `{"ok": true}`

定时任务（可选）：

1. 新建 Cron Job
2. Build Command 同上
3. Job Command: `python3 robot-portal/run.py`
4. Schedule: 每日
5. 同步设置与后端相同环境变量

使用蓝图一键部署（推荐）：

1. Render Dashboard → Blueprints → New Blueprint
2. 选择仓库并识别 `render.yaml`
3. 在 Blueprint 界面为 `DEEPSEEK_API_KEY`、`SUPABASE_*`、`ALLOWED_ORIGINS` 填值
4. Apply Blueprint 后即创建 Web 服务与每日 Cron Job

手动触发每日任务（受保护）：

- 端点：`POST /tasks/run-daily`
- 保护：设置后端环境变量 `TASK_TOKEN`，调用时需在请求头带 `X-Task-Token: <TOKEN>`（或使用查询参数 `?token=<TOKEN>`）
- 示例（本地，如未设置 `TASK_TOKEN` 则直接可用）：
  ```
  curl -X POST http://localhost:8000/tasks/run-daily
  ```
- 示例（生产）：
  ```
  curl -X POST https://<your-api>.onrender.com/tasks/run-daily \
    -H "X-Task-Token: <YOUR_TASK_TOKEN>"
  ```

## 部署到 Vercel（前端）

1. 新建 Project，Root Directory 选择 `robot-portal/frontend`
2. 环境变量：
   - `NEXT_PUBLIC_API_BASE=https://你的后端域名.onrender.com`
3. 构建完成后访问 Vercel 域名
4. 可选：已包含最简 `vercel.json`，Vercel 会自动识别 Next.js

## 常见问题

- 跨域：在后端设置 `ALLOWED_ORIGINS` 为 Vercel 域名
- 密钥安全：只在后端配置 `DEEPSEEK_API_KEY`，不要暴露到前端或 Git
- 构建失败：前端需要 Node 18+，后端 Python 3.10+

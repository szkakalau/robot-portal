import { getRobots } from '../../lib/api'

export default async function RobotsPage() {
  const robots = await getRobots()
  return (
    <div>
      <h1>机器人数据库</h1>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={{textAlign:'left'}}>名称</th>
            <th style={{textAlign:'left'}}>公司</th>
            <th style={{textAlign:'left'}}>分类</th>
            <th style={{textAlign:'left'}}>价格</th>
          </tr>
        </thead>
        <tbody>
          {robots.map((r:any)=>(
            <tr key={r.id || r.name}>
              <td>{r.name}</td>
              <td>{r.company || '-'}</td>
              <td>{r.category || '-'}</td>
              <td>{r.price || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

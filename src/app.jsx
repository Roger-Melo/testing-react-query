import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const fetchUser = username => fetch(`https://api.github.com/users/${username}`)
  .then(res => res.json())
  .then(data => ({ id: data.id, name: data.name, avatarUrl: data.avatar_url }))

const UserPicker = ({ onChangeUser }) => users.map((_, i) =>
  <button key={i} onClick={() => onChangeUser(i)}>Usuário {`${i + 1}`}</button>)

const users = ['Roger-Melo', 'ryanflorence', 'getify', 'gaearon']

const User = () => {
  const [username, setUsername] = useState(users[0])
  const { isLoading, isError, isSuccess, error, data } = useQuery({
    queryKey: ['user', username],
    queryFn: () => fetchUser(username)
  })

  const changeUser = i => setUsername(users[i])

  return (
    <>
      <UserPicker onChangeUser={changeUser} />
      {isLoading && <p>Carregando informações...</p>}
      {isError && <p>{error.message}</p>}
      {isSuccess && (
        <>
          <h1>{data.name}</h1>
          <img src={data.avatarUrl} alt={`Foto de ${data.name}`} className="avatar" />
        </>
      )}
    </>
  )
}

const App = () => <User />

export { App }

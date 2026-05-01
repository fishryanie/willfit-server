import React, { useEffect, useMemo, useState } from 'react'
import { ApiClient } from 'adminjs'
import { Box, Button, H2, H3, Icon, Loader, Text } from '@adminjs/design-system'

const api = new ApiClient()

const palette = {
  blue: ['#2563eb', '#dbeafe'],
  green: ['#059669', '#d1fae5'],
  orange: ['#ea580c', '#ffedd5'],
  purple: ['#7c3aed', '#ede9fe']
}

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.07)'
}

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value || 0)

const formatDate = (date) => {
  if (!date) return 'No date'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
    new Date(date)
  )
}

const MetricCard = ({ metric }) => {
  const [accent, tint] = palette[metric.tone] || palette.blue

  return (
    <Box style={cardStyle} p="24px">
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Text color="grey60" fontSize="12px" textTransform="uppercase">
            {metric.label}
          </Text>
          <Text color="grey100" fontSize="34px" fontWeight="700" mt="10px">
            {formatNumber(metric.value)}
          </Text>
        </Box>
        <Box
          width="42px"
          height="42px"
          borderRadius="8px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          style={{ background: tint, color: accent }}
        >
          <Icon icon="Activity" />
        </Box>
      </Box>
      <Text color="grey60" mt="18px">
        {metric.helper}
      </Text>
    </Box>
  )
}

const OperationRow = ({ item }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" py="13px" borderBottom="1px solid #eef2f7">
    <Box>
      <Text color="grey100" fontWeight="600">
        {item.label}
      </Text>
      <Text color="grey60" fontSize="12px" mt="4px">
        {item.helper}
      </Text>
    </Box>
    <Text color="grey100" fontSize="22px" fontWeight="700">
      {formatNumber(item.value)}
    </Text>
  </Box>
)

const ActivityBar = ({ item }) => {
  const width = `${Math.max(6, Math.round((item.value / item.max) * 100))}%`

  return (
    <Box mb="18px">
      <Box display="flex" justifyContent="space-between" mb="8px">
        <Text color="grey80">{item.label}</Text>
        <Text color="grey100" fontWeight="600">
          {formatNumber(item.value)}
        </Text>
      </Box>
      <Box height="9px" borderRadius="8px" style={{ background: '#e5e7eb', overflow: 'hidden' }}>
        <Box height="9px" borderRadius="8px" style={{ width, background: '#2563eb' }} />
      </Box>
    </Box>
  )
}

const ContactRow = ({ contact }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" py="14px" borderBottom="1px solid #eef2f7">
    <Box>
      <Text color="grey100" fontWeight="600">
        {contact.name || 'Unknown contact'}
      </Text>
      <Text color="grey60" fontSize="12px" mt="4px">
        {contact.email || contact.type || 'No email'}
      </Text>
    </Box>
    <Box textAlign="right">
      <Text color={contact.processed ? 'success' : 'warning'} fontWeight="600" fontSize="12px">
        {contact.processed ? 'Processed' : 'Open'}
      </Text>
      <Text color="grey60" fontSize="12px" mt="4px">
        {formatDate(contact.createdAt)}
      </Text>
    </Box>
  </Box>
)

const Dashboard = () => {
  const [state, setState] = useState({ loading: true, data: null, error: null })

  useEffect(() => {
    let mounted = true

    api
      .getDashboard()
      .then((response) => {
        if (mounted) setState({ loading: false, data: response.data, error: null })
      })
      .catch((error) => {
        if (mounted) setState({ loading: false, data: null, error })
      })

    return () => {
      mounted = false
    }
  }, [])

  const updatedAt = useMemo(() => formatDate(state.data?.generatedAt), [state.data?.generatedAt])

  if (state.loading) {
    return (
      <Box minHeight="420px" display="flex" alignItems="center" justifyContent="center">
        <Loader />
      </Box>
    )
  }

  if (state.error) {
    return (
      <Box p="32px">
        <Box style={cardStyle} p="28px">
          <H3>Dashboard unavailable</H3>
          <Text color="grey60" mt="10px">
            The dashboard metrics could not be loaded. Please refresh the page.
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box p={['20px', '28px', '36px']} style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="flex-end" mb="28px" style={{ gap: '16px' }}>
        <Box>
          <Text color="grey60" fontSize="12px" textTransform="uppercase">
            WillFit operations
          </Text>
          <H2 marginBottom="0">Admin dashboard</H2>
          <Text color="grey60" mt="8px">
            Updated {updatedAt}
          </Text>
        </Box>
        <Button variant="primary" as="a" href="/admin/resources/contacts/actions/list">
          <Icon icon="Mail" />
          Review contacts
        </Button>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(210px, 1fr))" style={{ gap: '18px' }} mb="24px">
        {state.data.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </Box>

      <Box display="grid" gridTemplateColumns={['1fr', '1fr', '1.15fr 0.85fr']} style={{ gap: '22px' }}>
        <Box style={cardStyle} p="24px">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
            <H3 marginBottom="0">30 day activity</H3>
            <Text color="grey60" fontSize="12px">
              Live MongoDB totals
            </Text>
          </Box>
          {state.data.activity.map((item) => (
            <ActivityBar key={item.label} item={item} />
          ))}
        </Box>

        <Box style={cardStyle} p="24px">
          <H3 marginBottom="8px">Operations</H3>
          {state.data.operations.map((item) => (
            <OperationRow key={item.label} item={item} />
          ))}
        </Box>
      </Box>

      <Box display="grid" gridTemplateColumns={['1fr', '1fr', '1fr 1fr']} style={{ gap: '22px' }} mt="22px">
        <Box style={cardStyle} p="24px">
          <H3 marginBottom="8px">Latest contacts</H3>
          {state.data.latestContacts.length ? (
            state.data.latestContacts.map((contact) => <ContactRow key={contact.id} contact={contact} />)
          ) : (
            <Text color="grey60" mt="16px">
              No contacts yet.
            </Text>
          )}
        </Box>

        <Box style={cardStyle} p="24px">
          <H3 marginBottom="8px">Quick access</H3>
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" style={{ gap: '12px' }} mt="18px">
            {state.data.quickLinks.map((link) => (
              <Button key={link.resourceId} as="a" href={`/admin/resources/${link.resourceId}/actions/list`} variant="light">
                {link.label}
              </Button>
            ))}
          </Box>
          <Box mt="24px" p="18px" borderRadius="8px" style={{ background: '#f1f5f9' }}>
            <Text color="grey100" fontWeight="700">
              Inbox pulse
            </Text>
            <Text color="grey60" mt="8px">
              {formatNumber(state.data.inbox.conversations)} conversations, {formatNumber(state.data.inbox.messagesLastWeek)} messages this week,
              {' '}
              {formatNumber(state.data.inbox.notificationInbox)} notification inbox records.
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Dashboard
